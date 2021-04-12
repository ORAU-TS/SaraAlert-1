# frozen_string_literal: true

# PublicHealthController: handles all epi actions
class PublicHealthController < ApplicationController
  include PatientQueryHelper

  before_action :authenticate_user!
  before_action :authenticate_user_role

  def patients
    patients_table_data(params)
  end

  def potential_patients
    permitted_params = params.permit(:workflow, :tab, :jurisdiction, :scope, :user, :search, :entries, :page, :order, :direction, :filter)

    # Validate workflow param
    workflow = permitted_params.require(:workflow).to_sym
    return head :bad_request unless %i[self_enrolled].include?(workflow)

    # Validate jurisdiction param
    jurisdiction = permitted_params[:jurisdiction]
    return head :bad_request unless jurisdiction.nil? || jurisdiction == 'all' || current_user.jurisdiction.subtree_ids.include?(jurisdiction.to_i)

    # Validate tab param
    tab = permitted_params.require(:tab).to_sym
    return head :bad_request unless %i[all self_enrolled].include?(tab)

    # Validate scope param
    scope = permitted_params[:scope]&.to_sym
    return head :bad_request unless scope.nil? || %i[all exact].include?(scope)

    # Validate user param
    user = permitted_params[:user]
    return head :bad_request unless user.nil? || %w[all none].include?(user) || user.to_i.between?(1, 9999)

    # Validate search param
    search = permitted_params[:search]

    # Validate pagination params
    entries = permitted_params[:entries]&.to_i || 25
    page = permitted_params[:page]&.to_i || 0
    return head :bad_request unless entries >= 0 && page >= 0

    # Validate sort params (UPDATE SORT PARAMS)
    order = permitted_params[:order]
    return head :bad_request unless order.nil? || order.blank? || %w[name email jurisdiction].include?(order)

    direction = permitted_params[:direction]
    return head :bad_request unless direction.nil? || direction.blank? || %w[asc desc].include?(direction)
    return head :bad_request unless (!order.blank? && !direction.blank?) || (order.blank? && direction.blank?)

    # Get potential patients
    potential_patients = current_user.viewable_potential_patients

    # Filter by assigned jurisdiction
    unless jurisdiction.nil? || jurisdiction == 'all'
      jur_id = jurisdiction.to_i
      potential_patients = scope == :all ? potential_patients.where(jurisdiction_id: Jurisdiction.find(jur_id).subtree_ids) : potential_patients.where(jurisdiction_id: jur_id)
    end

    # Filter by search text
    potential_patients = filter_potential(potential_patients, search)

    # Sort
    potential_patients = sort_potential(potential_patients, order, direction)

    # Paginate
    potential_patients = potential_patients.paginate(per_page: entries, page: page + 1)

    render json: linelist_potential(potential_patients)
  end

  def patients_count
    # Validate filter and sorting params
    begin
      query = validate_patients_query(params.require(:query))
    rescue StandardError => e
      return render json: e, status: :bad_request
    end

    # Get count of filtered patients
    render json: { count: patients_by_query(current_user, query)&.size }
  end

  # Get patient counts by workflow
  def workflow_counts
    render json: {
      exposure: current_user.viewable_patients.where(isolation: false, purged: false).size,
      isolation: current_user.viewable_patients.where(isolation: true, purged: false).size,
      self_enrolled: current_user.viewable_potential_patients.size
    }
  end

  # Get counts for patients under the given workflow and tab
  def tab_counts
    # Validate workflow param
    workflow = params.require(:workflow).to_sym
    return head :bad_request unless %i[exposure isolation self_enrolled].include?(workflow)

    # Validate tab param
    tab = params.require(:tab).to_sym
    if workflow == :exposure
      return head :bad_request unless %i[all symptomatic non_reporting asymptomatic pui closed transferred_in transferred_out].include?(tab)
    elsif workflow == :isolation
      return head :bad_request unless %i[all requiring_review non_reporting reporting closed transferred_in transferred_out].include?(tab)
    else 
      return head :bad_request unless %i[all self_enrolled].include?(tab)
    end

    # Get patients by workflow and tab
    patients = patients_by_linelist(current_user, workflow, tab, current_user.jurisdiction)

    render json: { total: patients.size }
  end

  protected

  def filter_potential(potential_patients, search)

    return potential_patients if search.nil? || search.blank?

    potential_patients.where('lower(first_name) like ?', "#{search&.downcase}%").or(
      potential_patients.where('lower(last_name) like ?', "#{search&.downcase}%").or(
        potential_patients.where('lower(potential_patients.email) like ?', "#{search&.downcase}")
      )
    )
  end

  def sort_potential(potential_patients, order, direction)
    return potential_patients if order.nil? || order.empty? || direction.nil? || direction.blank?

    # Satisfy brakeman with additional sanitation logic
    dir = direction == 'asc' ? 'asc' : 'desc'

    case order
    when 'name'
      potential_patients = potential_patients.order(last_name: dir).order(first_name: dir)
    when 'email'
      potential_patients = potential_patients.order(email: dir)
    when 'jurisdiction'
      potential_patients = potential_patients.includes(:jurisdiction).order('jurisdictions.name ' + dir)
    when 'exposed'
      potential_patients = potential_patients.order('CASE WHEN exposed is NULL THEN 1 ELSE 0 END, exposed ' + dir)
    when 'tested_positive'
      potential_patients = potential_patients.order('CASE WHEN tested_positive is NULL THEN 1 ELSE 0 END, tested_positive ' + dir)
    when 'concerning_symptoms'
      potential_patients = potential_patients.order('CASE WHEN concering_symptoms is NULL THEN 1 ELSE 0 END, concerning_symptoms ' + dir)
    end

    potential_patients
  end

  def linelist_potential(potential_patients)
    # get a list of fields relevant only to this linelist
    fields = %i[name email jurisdiction exposed tested_positive concerning_symptoms confirmed]

    # execute query and get total count
    total = potential_patients.total_entries

    # retrieve proper jurisdictions
    potential_patients = potential_patients.joins(:jurisdiction)

    # determine if role can edit
    editable = true unless current_user.role?(Roles::PUBLIC_HEALTH)

    # only select patient fields necessary to generate linelists
    potential_patients = potential_patients.select('potential_patients.id, potential_patients.first_name, potential_patients.last_name, '\
                                                   'potential_patients.concerning_symptoms, potential_patients.verification_code, '\
                                                   'potential_patients.email, potential_patients.exposed, potential_patients.tested_positive, '\
                                                   'potential_patients.confirmed, potential_patients.created_at, potential_patients.updated_at, '\
                                                   'jurisdictions.name AS jurisdiction_name, jurisdictions.path AS jurisdiction_path, '\
                                                   'jurisdictions.email as jurisdiction_email, jurisdictions.id AS jurisdiction_id')

    linelist = []
    potential_patients.each do |pot_pat|
      details = {
        id: pot_pat[:id],
        name: pot_pat.displayed_name,
        email: pot_pat.email,
        jurisdiction: pot_pat.jurisdiction_name,
        exposed: pot_pat.exposed,
        tested_positive: pot_pat.tested_positive,
        concerning_symptoms: pot_pat.concerning_symptoms,
        confirmed: pot_pat.confirmed
      }
      
      linelist << details
    end
    { linelist: linelist, fields: fields, total: total, editable: editable }
  end

  private

  def authenticate_user_role
    # Restrict access to public health only
    redirect_to(root_url) && return unless current_user.can_view_public_health_dashboard?
  end
end

# frozen_string_literal: true

# VaccinesController: Vaccine records
class VaccinesController < ApplicationController
  before_action :authenticate_user!

  # create a new vaccine record
  def create
    redirect_to root_url && return unless current_user.can_create_patient_vaccines?

    permitted_params = params.require(:vaccine).permit(
      :vaccinated, :first_vac_date, :second_vac_date, :patient_id, :disease, :vac_type, :lot_number)
    
    vac = Vaccine.new(permitted_params)
    vac.save!
    
    History.vac_record(patient: permitted_params[:patient_id],
                       created_by: current_user.email,
                       comment: "User added a new vaccine record (ID: #{vac.id}).")
  end

  def update
    redirect_to root_url && return unless current_user.can_edit_patient_vaccines?

    permitted_params = params.require(:vaccine).permit(
      :vaccinated, :first_vac_date, :second_vac_date, :patient_id, :disease, :vac_type, :lot_number)
    permitted_id = params.require(:id)
    
    vac = Vaccine.find_by(id: permitted_id)
    vac.update!(permitted_params)

    History.vac_record_edit(patient: permitted_params[:patient_id],
                            created_by: current_user.email,
                            comment: "User edited a vaccine record (ID: #{vac.id}).")
  end

  def populate_vaccine_modal
    permitted_id = params.require(:id)

    diseases = Patient.joins(:jurisdiction, :vaccines).where(id: permitted_id).distinct.order(:disease).pluck(:disease).reject(&:blank?)
    vaccine_types = Patient.joins(:jurisdiction, :vaccines).where(id: permitted_id).distinct.order(:vac_type).pluck(:vac_type).reject(&:blank?)
    lot_numbers = Patient.joins(:jurisdiction, :vaccines).where(id: permitted_id).distinct.order(:lot_number).pluck(:lot_number).reject(&:blank?)

    render json: { diseases: diseases, vaccine_types: vaccine_types, lot_numbers: lot_numbers }
  end



end
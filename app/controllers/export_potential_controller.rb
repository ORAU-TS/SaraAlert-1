# frozen_string_literal: true

require 'axlsx'

# ExportController: for exporting subjects
class ExportPotentialController < ApplicationController
  include ImportExport

  before_action :authenticate_user!
  before_action :authenticate_user_role

  def csv_linelist
    # Verify params
    redirect_to(root_url) && return unless %w[self_enrolled].include?(params[:workflow])

    export_type = "csv_linelist_self_enroll".to_sym
    return if exported_recently?(export_type)

    # Clear out old receipts and create a new one
    current_user.export_receipts.where(export_type: export_type).destroy_all
    ExportReceipt.create(user_id: current_user.id, export_type: export_type)

    # Spawn job to handle export
    config = {
      user_id: current_user.id,
      export_type: export_type,
      format: 'csv',
      filename: "Sara-Alert-Linelist-Self-Enrolled",
      filename_data_type: false,
      data: {
        patients: {
          checked: LINELIST_POTENTIAL_FIELDS,
          headers: LINELIST_POTENTIAL_HEADERS,
          query: { workflow: params[:workflow] }
        }
      }
    }

    ExportPotentialJob.perform_later(config)
    #ExportJob.perform_later(config)

    respond_to do |format|
      format.any { head :ok }
    end
  end

  def sara_alert_format
    # Verify params
    redirect_to(root_url) && return unless %w[self_enrolled].include?(params[:workflow])

    export_type = "sara_alert_format_self_enroll".to_sym
    return if exported_recently?(export_type)

    # Clear out old receipts and create a new one
    current_user.export_receipts.where(export_type: export_type).destroy_all
    ExportReceipt.create(user_id: current_user.id, export_type: export_type)

    # Spawn job to handle export
    config = {
      user_id: current_user.id,
      export_type: export_type,
      format: 'xlsx',
      filename: "Sara-Alert-Format-Self-Enrolled",
      filename_data_type: false,
      data: {
        patients: {
          checked: LINELIST_POTENTIAL_FIELDS,
          headers: LINELIST_POTENTIAL_FIELDS,
          query: { workflow: params[:workflow] }
        }
      }
    }

    ExportPotentialJob.perform_later(config)

    respond_to do |format|
      format.any { head :ok }
    end
  end

  private

  def exported_recently?(export_type)
    return false
    exp_recently = current_user.export_receipts.where(export_type: export_type).where('created_at > ?', 1.hour.ago).exists?
    render json: { message: 'You have already initiated an export of this type in the last hour. Please try again later.' }.to_json, status: 401 if exp_recently
    exp_recently
  end

  def validate_checked_fields(data, data_type)
    unsanitized_checked = data.require(data_type).permit(checked: [])[:checked]
    raise StandardError('Checked must be an array') unless unsanitized_checked.is_a?(Array)

    checked = unsanitized_checked.map(&:to_sym)
    checked.each do |field|
      raise StandardError("Unknown field '#{field}' for '#{data_type}'") unless ALL_FIELDS_NAMES[data_type].keys.include?(field)
    end

    checked
  end

  def authenticate_user_role
    redirect_to(root_url) && return unless current_user.can_export?
  end
end

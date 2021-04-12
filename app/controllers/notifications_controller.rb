# frozen_string_literal: true

# NotificationsController
class NotificationsController < ApplicationController
  before_action :authenticate_user!
  before_action :go_home_if_cant_manage_settings

  def available_notifications
    patient = current_user.get_patient(params.require(:patient_id))
    redirect_to(root_url) && return if patient.nil?

    # if the email is not customized, there's no recipients
    isolation = patient.isolation && CustomMessage.is_customized(patient.jurisdiction_id, :isolation_email)
    quarantine = !patient.isolation && CustomMessage.is_customized(patient.jurisdiction_id, :quarantine_email)
    housing = CustomMessage.is_customized(patient.jurisdiction_id, :quarantine_email)

    notifications = {}
    notifications[:isolation] = isolation
    notifications[:quarantine] = quarantine
    notifications[:housing] = housing

    render json: notifications
  end

  def send_notifications
    patient = current_user.get_patient(params.require(:patient_id))
    redirect_to(root_url) && return if patient.nil?

    notifications = params.require(:notifications).permit(:isolation, :quarantine, :housing)
    isolation = notifications[:isolation]
    quarantine = notifications[:quarantine]
    housing = notifications[:housing]
    
    patient.send_saa_notifications(isolation, quarantine, housing)
    head :ok
  end

  private

  def go_home_if_cant_manage_settings
    redirect_to(root_url) unless current_user.manage_settings?
  end

end

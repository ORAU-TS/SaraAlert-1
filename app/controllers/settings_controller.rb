# frozen_string_literal: true

# SettingsController
class SettingsController < ApplicationController
  before_action :authenticate_user!
  before_action :go_home_if_cant_manage_settings

  def index
    redirect_to action: :notifications
  end

  def notifications
    jurisdiction_id = current_user.jurisdiction.id
    @all_messages = CustomMessage.all_messages jurisdiction_id
  end

  def get_notification
    jurisdiction_id = current_user.jurisdiction.id
    custom_message = CustomMessage.get_custom_notification(params[:message_type], jurisdiction_id)

    render json: custom_message
  end

  def create_or_update_notification
    message = params.require(:message).permit(:message_type, :subject, :body, :recipients)
    is_customized = CustomMessage.create_or_update_notification(message, current_user.jurisdiction.id)
    
    render json: { is_customized: is_customized }
  end

  def revert_notification
    CustomMessage.clear_custom_notification(params[:message_type], current_user.jurisdiction.id)

    render json: { is_customized: false }
  end

  def jurisdictions
    @jurisdiction_root = {}
    @jurisdiction_root = get_jurisdiction_subtree(current_user.jurisdiction.root)
  end

  def create_jurisdiction
    @jurisdiction_root = current_user.jurisdiction
    Jurisdiction.find(params.require(:parent_id))
    new_jurisdiction = Jurisdiction.new(name: params.require(:name))
    new_jurisdiction.parent = Jurisdiction.find(params.require(:parent_id))
    new_jurisdiction.save
    new_jurisdiction.set_unique_identifier_and_path
    new_jurisdiction.hierarchical_symptomatic_condition
    new_jurisdiction.save
    
    render json: { jurisdiction: serialize_jurisdiction(new_jurisdiction) }
  end

  def delete_jurisdiction
    jur = Jurisdiction.find(params.require(:id))
    jur.destroy
  end

  def update_jurisdiction
    jur = Jurisdiction.find(params.require(:id))
    jur.name = params.require(:name)
    jur.save
    jur.set_unique_identifier_and_path
    jur.hierarchical_symptomatic_condition
    jur.save

    render json: { jurisdiction: serialize_jurisdiction(jur) }
  end

  private

  def go_home_if_cant_manage_settings
    redirect_to(root_url) unless current_user.manage_settings?
  end

  def serialize_jurisdiction(jur) 
    hash = {}
    hash[:id] = jur.id
    hash[:name] = jur.name
    hash[:patient_count] = Patient.where(jurisdiction_id: jur.id).count
    hash[:children] = []
    hash
  end
  
  def get_jurisdiction_subtree(jur)
    jurisdiction_hash = serialize_jurisdiction(jur)
    jur.children.each do |j|
      child_hash = get_jurisdiction_subtree(j)
      jurisdiction_hash[:children].push(child_hash)
    end
    jurisdiction_hash
  end

end

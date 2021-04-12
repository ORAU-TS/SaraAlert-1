# frozen_string_literal: true

require 'redis'
require 'redis-queue'

class ProducePotentialPatientJob < ApplicationJob
  queue_as :default

  def perform(patient, assessment_data = {})
    Rails.logger.info "running ProducePotentialPatientJob for #{patient.email}"
    puts "running ProducePotentialPatientJob for #{patient.email}"
    queue = Redis::Queue.new('se_bridge', 'bp_se_bridge', redis: Rails.application.config.redis)
    patient_hash = {
      patient: {
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        jurisdiction_unique_identifier: patient.jurisdiction.unique_identifier, #id can be different in assessment and enrollment
        exposed: patient.exposed,
        tested_positive: patient.tested_positive,
        concerning_symptoms: patient.concerning_symptoms,
        confirmed: patient.confirmed
      } 
    }
    patient_hash[:assessment_data] = assessment_data unless assessment_data.empty?
    queue.push patient_hash.to_json
    Rails.logger.info "completed ProducePotentialPatientJob for #{patient.email}"
    puts "completed ProducePotentialPatientJob for #{patient.email}"
  end
end

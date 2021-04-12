# frozen_string_literal: true

require 'redis'
require 'redis-queue'

# ConsumeAssessmentsJob: Pulls assessments created in the split instance and saves them
class ConsumePotentialPatientJob < ApplicationJob
  queue_as :default

  def perform
    queue = Redis::Queue.new('se_bridge', 'bp_se_bridge', redis: Rails.application.config.redis)

    while (msg = queue.pop)
      Rails.logger.info "message received: #{msg}"
      puts "message received: #{msg}"
      begin
        message = JSON.parse(msg)
        patient_data = message["patient"]

        #bugfix for cases where jurisdiction id in assessment and enrollment are different
        jurisdiction_unique_identifier = patient_data.delete 'jurisdiction_unique_identifier'

        patient_data['jurisdiction_id'] = Jurisdiction
          .where(unique_identifier: jurisdiction_unique_identifier)
          .pluck(:id).first

        potential_patient = PotentialPatient.create!(patient_data)
        potential_patient.update(assessment: message["assessment_data"]) unless message["assessment_data"].nil?

        Rails.logger.info "self enrollment completed for: #{message}"
        puts "self enrollment completed for: #{message}"
        queue.commit
      rescue JSON::ParserError
        Rails.logger.info 'ConsumePotentialPatientJob: skipping invalid message...'
        puts 'ConsumePotentialPatientJob: skipping invalid message...'
        queue.commit
        next
      end
    end
  rescue Redis::ConnectionError, Redis::CannotConnectError => e
    Rails.logger.info "ConsumePotentialPatientJob: Redis::ConnectionError (#{e}), retrying..."
    puts "ConsumePotentialPatientJob: Redis::ConnectionError (#{e}), retrying..."
    sleep(1)
    retry
  end
end

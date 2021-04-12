# frozen_string_literal: true

namespace :reports do
  desc "Receive and Process Reports"
  task receive_and_process_reports: :environment do
    consume_workers = ENV.fetch("CONSUME_WORKERS") { 8 }
    consume_workers.times do
      Process.fork do
        ConsumeAssessmentsJob.perform_now
      end
    end
    Process.waitall
  end

  desc "Receive and Process Self Enrollment"
  task receive_and_process_self_enrollment: :environment do
    4.times do
      Process.fork do
        ConsumePotentialPatientJob.perform_now
      end
    end
    Process.waitall
  end
end

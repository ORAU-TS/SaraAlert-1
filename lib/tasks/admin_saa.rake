require 'securerandom'
require 'io/console'
require 'digest'

namespace :admin do

  desc "Import/Update Buildings"
  task import_or_update_buildings: :environment do
    ActiveRecord::Base.transaction do
      yml_file = 'config/sara/buildings.yml'
      config_contents = YAML.load_file(yml_file)
      
      config_contents.each do |jur_name, building_names|
        if building_names.nil?
          puts "WARNING: Unable to find building names for #{jur_name}"
          next
        end

        puts "#{jur_name} - #{building_names}"
        jur = Jurisdiction.find_by path: jur_name

        if jur.nil?
          puts "WARNING: Unable to find jurisdiction: #{jur_name}"
          next
        end

        jur.buildings.destroy_all

        building_names.each do |building_name|
          puts "Adding #{building_name} to #{jur_name}"
          jur.buildings.create! name: building_name
        end
      end
      
      puts ''
      puts 'Building update complete!'
    end
  end

  desc "Scrub database for handoff to named jurisdiction"
  task scrub_monitorees_except: :environment do
    jurisdiction_name = ENV['KEEP_JURISDICTION_NAME']

    jurisdiction_exists =  Jurisdiction.where(name: jurisdiction_name).any?
    unless jurisdiction_exists
      puts jurisdiction_exists
      puts "Error: Jurisdiction with name '#{jurisdiction_name}' not found."
      exit
    end

    ActiveRecord::Base.transaction do
      purged = []
      to_purge = Patient.purge_and_delete(jurisdiction_name)

      if to_purge.count == 0
        puts "There are no monitorees to remove.  Exiting..."
        exit
      end

      puts "You are about to delete #{to_purge.count} monitoree(s).  Are you sure?"
      input = STDIN.gets.strip.downcase
      if input != 'y'
        puts "Exiting..."
        exit
      end
  
      # Loop through and purge
      to_purge.each do |monitoree|
        monitoree.destroy
        
        purged << monitoree.id
      rescue StandardError => e
        puts "Error: Jurisdiction with name #{jurisdiction_name} not found."
        raise ActiveRecord::Rollback
        exit
      end
  
      # Additional cleanup
      Download.delete_all
      AssessmentReceipt.delete_all
      Symptom.where(condition_id: ReportedCondition.where(assessment_id: Assessment.where('patient_id in (?)', purged).ids).ids).delete_all
      ReportedCondition.where(assessment_id: Assessment.where('patient_id in (?)', purged).ids).delete_all
      Assessment.where('patient_id in (?)', purged).delete_all
    end
  end

end

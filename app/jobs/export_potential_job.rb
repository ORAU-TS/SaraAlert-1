# frozen_string_literal: true

# ExportJob: prepare an export for a user
class ExportPotentialJob < ApplicationJob
  queue_as :exports
  include ImportExport

  # Limits number of Potential Patient records to be considered for a single exported file to handle maximum file size limit.
  # Adds additional files as needed if exceeds batch size.
  OUTER_BATCH_SIZE = ENV['EXPORT_OUTER_BATCH_SIZE']&.to_i || 10_000

  # Inner batch size limits number of Patient records details help in memory at once before writing to file.
  INNER_BATCH_SIZE = ENV['EXPORT_INNER_BATCH_SIZE']&.to_i || 500

  def perform(config)
    # Get user in order to query viewable patients
    user = User.find_by(id: config[:user_id])
    return if user.nil?

    # Delete any existing downloads of this type
    user.downloads.where(export_type: config[:export_type]).delete_all

    # Extract data
    data = config[:data]
    return if data.nil?

    # Construct export
    lookup = []

    # look up what potential patients we will be pulling, based on the jurisidiction heirarchy
    root_jurisdiction = user.jurisdiction.root
    patients = root_jurisdiction.all_potential_patients

    # NOTE: in_batches appears to NOT sort within batches, so explicit ordering on ID is also done deeper down.
    # The reorder('') here allows this ordering done later on to work properly.
    patients.reorder('').in_batches(of: OUTER_BATCH_SIZE).each_with_index do |patients_group, index|
      file = write_export_potential_data_to_files(config, patients_group, index, INNER_BATCH_SIZE)

      lookup_value = SecureRandom.uuid
      Download.insert(user_id: config[:user_id], export_type: config[:export_type], filename: file[:filename],
                                     lookup: lookup_value, contents: file[:content], created_at: DateTime.now, updated_at: DateTime.now)
      lookup.concat([{ lookup: lookup_value, filename: file[:filename] }])
    end

    # Send an email to user
    UserMailer.download_email(user, EXPORT_TYPES[config[:export_type]][:label] || 'default', lookup, OUTER_BATCH_SIZE).deliver_later
  end

end

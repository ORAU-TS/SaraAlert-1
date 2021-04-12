# frozen_string_literal: true

require 'roo'

# ImportController: for importing subjects from other formats
class ImportPotentialController < ApplicationController
  include ImportExport
  include PatientHelper

  before_action :authenticate_user!

  def index
    redirect_to(root_url) && return unless current_user.can_import?
  end

  def download_guidance
    send_file(
      "#{Rails.root}/public/Sara%20Alert%20Import%20Format.xlsx",
      filename: 'Sara%20Alert%20Import%20Format.xlsx',
      type: 'application/vnd.ms-excel'
    )
  end

  def import
    redirect_to(root_url) && return unless current_user.can_import?

    redirect_to(root_url) && return unless params.permit(:workflow)[:workflow] == 'self_enrolled'

    redirect_to(root_url) && return unless params.permit(:format)[:format] == 'sara_alert_format'

    workflow = params.permit(:workflow)[:workflow].to_sym
    format = params.permit(:format)[:format].to_sym

    valid_jurisdiction_ids = current_user.jurisdiction.subtree.pluck(:id)

    @errors = []
    @patients = []

    # Load and parse patient import excel
    begin
      xlsx = Roo::Excelx.new(params[:file].tempfile.path, file_warning: :ignore)
      validate_headers(format, xlsx.sheet(0).row(1))

      xlsx.sheet(0).each_with_index do |row, row_ind|
        next if row_ind.zero? # Skip headers

        fields = SARA_ALERT_POTENTIAL_FORMAT_FIELDS
        patient = { }
        fields.each_with_index do |field, col_num|
          next if field.nil?

          begin
            patient[field] = validate_field(field, row[col_num], row_ind) 

          rescue ValidationError => e
            @errors << e&.message || "Unknown error on row #{row_ind}"
          rescue StandardError => e
            @errors << e&.message || 'Unexpected error'
          end
        end

        # set jurisdiction to the importer's jurisdiction
        patient[:jurisdiction_id] = current_user.jurisdiction_id

        begin
          # Checking for duplicates under current user's viewable patients is acceptable because custom jurisdictions must fall under hierarchy
          patient[:duplicate_data] = current_user.viewable_potential_patients.duplicate_data(patient[:first_name],
                                                                                             patient[:last_name],
                                                                                             patient[:email])
        rescue ValidationError => e
          @errors << e&.message || "Unknown error on row #{row_ind}"
        rescue StandardError => e
          @errors << e&.message || 'Unexpected error'
        end
        @patients << patient
      end
    rescue ValidationError => e
      @errors << e&.message || "Unknown error on row #{row_ind}"
    rescue Zip::Error
      # Roo throws this if the file is not an excel file
      @errors << 'File Error: Please make sure that your import file is a .xlsx file.'
    rescue ArgumentError, NoMethodError => e
      # Roo throws this error when the columns are not what we expect
      @errors << "FE: '#{e&.message}' Please make sure that .xlsx import file is formatted in accordance with the formatting guidance."
    rescue StandardError => e
      # This is a catch all for any other unexpected error
      @errors << "Unexpected Error: '#{e&.message}' Please make sure that .xlsx import file is formatted in accordance with the formatting guidance."
    end

    render json: { patients: @patients, errors: @errors }
  end

  private

  def validate_headers(format, headers)
    SARA_ALERT_POTENTIAL_FORMAT_HEADERS.each_with_index do |field, col_num|
      next if field == headers[col_num]

      err_msg = "Invalid header in column #{col_num} should be '#{field}' instead of '#{headers[col_num]}'. "\
                'Please make sure to use the latest format specified by the Sara Alert Academic Format guidance doc.'
      raise ValidationError.new(err_msg, 1)
    end
  end

  def validate_field(field, value, row_ind)
    return value unless VALIDATION[field]

    value = validate_email_field(field, value, row_ind) if VALIDATION[field][:checks].include?(:email)

    value
  end

  def validate_email_field(field, value, row_ind)
    return nil if value.blank?
    unless ValidEmail2::Address.new(value).valid?
      raise ValidationError.new("'#{value}' is not a valid Email Address for '#{VALIDATION[field][:label]}'", row_ind)
    end

    value
  end

end

# Exception used for reporting validation errors
class ValidationError < StandardError
  def initialize(message, row_ind)
    super("Validation Error (row #{row_ind + 1}): #{message}")
  end
end

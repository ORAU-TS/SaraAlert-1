class PotentialPatientsController < ApplicationController
  before_action :check_human, only: [:create]
  before_action :authenticate_user!, only: [:import_create]

  def new; end
  def complete; end

  def create
    patient = PotentialPatient.new(potential_patients_params)

    if patient.has_confirmed_entry?
      render json: { error: "This email address has already been registered."}
      return
    end

    unless patient.try_get_jurisdiction
      render json: { error: "Email address does not belong to a university."}
      return
    end

    if !patient.valid? #shouldn't be possible from the front end
      render json: { error: "This does not appear to be a valid submission."}, status: :bad_request
      return
    end

    self_enrollment_actions(patient) 

    head :ok
  end

  def import_create
    patient = PotentialPatient.new(potential_patients_params)

    unless patient.jurisdiction_id
      render json: { error: "Patient doesn't have a jurisdiction id."}
      return
    end

    if !patient.valid?
      render json: { error: "This does not appear to be a valid submission."}, status: :bad_request
      return
    end

    patient.save

    head :ok
  end

  def confirm_code
    ps = confirm_code_params
    p = PotentialPatient.verify_code(ps[:email], ps[:confirmation_code])
    if p.nil?
      render json: { error: "That verification code doesn’t appear to be valid. Try entering your code again" }
      return
    end

    # send back potential patient and jurisdiction for creating symptoms
    render json: { jurisdiction_id: p.jurisdiction_id, patient_id: p.id}
  end

  # create job for new potential patient
  def submit_enrollee
    p = PotentialPatient.find(patient_id_params)
    if params.key?(:assessment)
      a = assessment_params
      assessment = { symptoms: a[:symptoms], threshold_hash: a[:threshold_hash] } 
      ProducePotentialPatientJob.perform_later(p, assessment)
    else
      ProducePotentialPatientJob.perform_later(p)
    end

    head :ok
  end

  def assessment_data
    jur_id = jurisdiction_params
    j = Jurisdiction.find(jur_id)
    if j.nil?
      render json: { error: "Jurisdiction doesn't appear to exist."}
      return
    end

    reporting_condition = j.hierarchical_condition_unpopulated_symptoms

    render json: { 
      symptoms: reporting_condition.symptoms,
      threshold_hash: reporting_condition.threshold_condition_hash
    }
  end

  def send_signup_sms
    body = params['Body'].downcase
    sms_number = params['From']
    contents = case body
               when 'hi', 'hello'
                 "Hello from Sara Alert Academic!"
               when '#feelbetter'
                 "Sign up for Sara Alert Acadedmic at: #{URI.join(root_url, '/r/signup')}"
               when '#narf'
                 "It's Pinky and the Brain Brain Brain Brain Brain."
               else
               end
    account_sid = ENV['TWILLIO_API_ACCOUNT']
    auth_token = ENV['TWILLIO_API_KEY']
    from = ENV['TWILLIO_SENDING_NUMBER']
    client = Twilio::REST::Client.new(account_sid, auth_token)
    client.messages.create(from: from, to: Phonelib.parse(sms_number, 'US').full_e164, body: contents)

    head :ok
  end

  def self_enrollment_actions(patient)
    patient.remove_old_entries
    patient.generate_verification_code
    patient.save
    patient.send_verification_code
  end

  def potential_patients_params
    params.require(:potential_patient).permit(:first_name, :last_name, :email, :exposed, :tested_positive, :concerning_symptoms, :jurisdiction_id)
  end

  def confirm_code_params
    params.require(:confirm_patient).permit(:email, :confirmation_code)
  end

  def patient_id_params
    params.require(:patient_id)
  end

  def jurisdiction_params
    params.require(:jurisdiction_id)
  end

  def assessment_params
    params.require(:assessment).permit!
  end

  # checking reCaptcha token
  def check_human
    if params[:captchaToken]
      url = "https://www.google.com/recaptcha/api/siteverify"
      response = Faraday.post(url, "secret=#{ADMIN_OPTIONS['google_recaptcha_secret']}&response=#{params[:captchaToken]}")
      body = JSON.parse(response.body)

      unless body["success"]
        render json: { error: "There was an issue with reCaptcha, please try again."}
        return
      end
    else
      render json: { error: "Please confirm that you are in fact a human."}
      return
    end
  end
end

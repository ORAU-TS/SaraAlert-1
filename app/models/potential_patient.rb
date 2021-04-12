class PotentialPatient < ApplicationRecord
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :email, presence: true, email: true

  belongs_to :jurisdiction

  serialize :assessment

  #generate a 7 digit code
  def generate_verification_code
    self.verification_code = ""
    7.times do
      self.verification_code += rand(1..9).to_s
    end
  end

  def has_confirmed_entry?
    PotentialPatient.where(confirmed: true).where(email: self.email).any?
  end

  def remove_old_entries
    PotentialPatient.where(email: self.email).destroy_all
  end

  def try_get_jurisdiction
    email_domain = self.email.split("@")[1]
    jurisdiction = JurisdictionEmail.find_by domain: email_domain
    return false if jurisdiction.nil?

    self.jurisdiction_id = jurisdiction.jurisdiction_id
    true
  end

  def send_verification_code
    SaaMailer.self_enrollment_confirmation(self.email, self.verification_code).deliver_now
  end

  def self.verify_code(email, code)
    p = PotentialPatient.where(email: email).where(verification_code: code).first
    unless p.nil?
      p.confirmed = true
      p.save!
    end
    p
  end

  # Patient name to be displayed in linelist
  def displayed_name
    first_name.present? || last_name.present? ? "#{last_name}#{first_name.blank? ? '' : ', ' + first_name}" : 'NAME NOT PROVIDED'
  end

  # Check for potential duplicate records. Duplicate criteria is as follows:
  # - matching first name, last name, email
  def self.duplicate_data(first_name, last_name, email)
    dup_info = where('first_name = ?', first_name)
               .where('last_name = ?', last_name)
               .where('email = ?', email)

    # Get fields that have matching values
    duplicate_field_data = []
    duplicate_field_data << { count: dup_info.count, fields: ['First Name', 'Last Name', 'Email'] } if dup_info.present?
  
    { is_duplicate: duplicate_field_data.length.positive?, duplicate_field_data: duplicate_field_data }
  end
end

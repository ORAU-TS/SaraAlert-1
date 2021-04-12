class CustomMessage < ApplicationRecord

  @@DATE_FORMAT_STR = "%b %d, %Y"
  @@ALL_MESSAGES_TYPES = {enrollment_sms_text_based: 1, assessment_sms_weblink: 2, monitoring_sms_complete: 3,
    enrollment_email: 4, assessment_email: 5, monitoring_complete_email: 6,
    shared_footer_text: 7, shared_button_text: 8,
    isolation_email: 9, quarantine_email: 10, housing_email: 11
  }
  enum message_type: @@ALL_MESSAGES_TYPES
  @@MESSAGE_FRIENDLY_NAME = {
    enrollment_sms_text_based: "SMS Texted Web Link - Thank You For Enrolling",
    assessment_sms_weblink: "SMS Texted Web Link - Symptoms Reporting",
    monitoring_sms_complete: "SMS Texted Web Link - Monitoring Complete",
    enrollment_email: "Email Template - Thank You For Enrolling",
    assessment_email: "Email Template - Symptoms Reporting",
    monitoring_complete_email: "Email Template - Monitoring Complete",
    shared_footer_text: "Email - Shared Footer",
    shared_button_text: "Email - Shared Report Button",
    isolation_email: "Isolation Template",
    quarantine_email: "Quarantine Template",
    housing_email: "Housing Template"
  }
  @@MESSAGE_VARIANT = {
    enrollment_sms_text_based: :sms,
    assessment_sms_weblink: :sms,
    monitoring_sms_complete: :sms,
    enrollment_email: :email,
    assessment_email: :email,
    monitoring_complete_email: :email,
    shared_footer_text: :shared_html,
    shared_button_text: :shared_text,
    isolation_email: :email,
    quarantine_email: :email,
    housing_email: :email
  }
  @@MESSAGE_DISPLAY_GROUP = {
    enrollment_sms_text_based: 1,
    assessment_sms_weblink: 1,
    monitoring_sms_complete: 1,
    enrollment_email: 2,
    assessment_email: 2,
    monitoring_complete_email: 2,
    shared_footer_text: 2,
    shared_button_text: 2,
    isolation_email: 3,
    quarantine_email: 3,
    housing_email: 3
  }
  @@MESSAGE_NEEDS_RECIPIENTS = {
    enrollment_sms_text_based: false,
    assessment_sms_weblink: false,
    monitoring_sms_complete: false,
    enrollment_email: false,
    assessment_email: false,
    monitoring_complete_email: false,
    shared_footer_text: false,
    shared_button_text: false,
    isolation_email: true,
    quarantine_email: true,
    housing_email: true
  }
  
  def self.all_messages(jurisdiction_id)
    messages = []
    @@ALL_MESSAGES_TYPES.each do |message, i| 
      messages.push({
        display_group: @@MESSAGE_DISPLAY_GROUP[message],
        title: @@MESSAGE_FRIENDLY_NAME[message],
        message_variant: @@MESSAGE_VARIANT[message],
        message_type: message,
        is_customized: self.is_customized(jurisdiction_id, message)
        })
    end
    messages
  end

  def self.is_customized(jurisdiction_id, message_type)
    root_jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    self.where(jurisdiction_id: root_jurisdiction_id, message_type: message_type).any?
  end

  def self.get_custom_notification(message_type, jurisdiction_id)
    message_type_sym = message_type.to_sym 
    
    message_type = message_type.to_s
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)

    custom_message = {}
    custom_message[:message_type] = message_type
    custom_message[:key_list] = self.send("#{message_type}_symbols")

    content = self.send("#{message_type}_content", jurisdiction_id)
    custom_message[:body] = content[:body]
    custom_message[:subject] = content[:subject]
    custom_message[:recipients] = content[:recipients ]

    custom_message[:needs_recipients] = @@MESSAGE_NEEDS_RECIPIENTS[message_type_sym]
    custom_message[:message_variant] = @@MESSAGE_VARIANT[message_type_sym]
    custom_message[:length_difference] = self.calc_length_difference(custom_message[:key_list])

    custom_message
  end

  def self.matches_original_message(message)
    message_type_s = message[:message_type].to_s
    message_type_sym = message[:message_type].to_sym

    return false if message[:recipients]

    is_email = @@MESSAGE_VARIANT[message_type_sym] == :email
    original_body = self.send("#{message_type_s}_body")
    body_matches = message[:body].strip == original_body.strip 
    return body_matches unless is_email

    original_subject = self.send("#{message_type_s}_subject")
    subject_matches = message[:subject].strip == original_subject.strip 
    return body_matches && subject_matches
  end

  def self.create_or_update_notification(message, jurisdiction_id)
    message[:jurisdiction_id] = self.get_jurisdiction_id(jurisdiction_id)
    if self.matches_original_message(message)
      self.where(jurisdiction_id: message[:jurisdiction_id], message_type: message[:message_type]).destroy_all
      return false 
    end 

    message[:message_type] = @@ALL_MESSAGES_TYPES[message[:message_type].to_sym]
    custom_message = self.find_custom_message(message[:message_type], message[:jurisdiction_id])
    if custom_message.nil?
      self.create! message
    else
      custom_message.update! message
    end
    return true
  end

  def self.find_custom_message(message_type, jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[message_type]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    self.find_by jurisdiction_id: jurisdiction_id, message_type: message_type
  end
  
  def self.clear_custom_notification(message_type, jurisdiction_id)
    custom_message = self.find_custom_message(message_type, jurisdiction_id)
     custom_message.destroy unless custom_message.nil?
  end

  #validation keys
  def self.initials_age
    { name: "{{InitialsAge}}", description: "Patient initials and age", real_length: 5 }
  end

  def self.assessment_link
    #this is a production url length, assuming we're using app.saraalertacademic.org
    { name: "{{AssessmentLink}}", description: "Link to assessment url", real_length: 65 }
  end

  def self.calc_length_difference(key_list)
    #we need this to quickly calculate the real difference
    length_difference = 0
    key_list.each do |key|
      length_difference += key[:name].length - key[:real_length]
    end
    length_difference
  end

  def self.symptom_onset_key
    { name: "{{SymptomOnsetDate}}", description: "Symptom Onset Date or Positive Test Date, whichever occurs first", real_length: 5 }
  end

  def self.isolation_end_key
    { name: "{{IsolationEnd}}", description: "Isolation End - 10 days later", real_length: 5 }
  end

  def self.last_exposure_key
    { name: "{{LastExposureDate}}", description: "Last Exposure Date", real_length: 5 }
  end

  def self.quarantine_end_key
    { name: "{{QuarantineEnd}}", description: "Quarantine End - 14 days later", real_length: 5 }
  end

  def self.isolation_or_quarantine
    { name: "{{IsolationOrQuarantine}}", description: "Isolation Or Quarantine", real_length: 5 }
  end

  def self.todays_date
    { name: "{{TodaysDate}}", description: "Today's Date", real_length: 5 }
  end

  def self.return_to_campus_date
    { name: "{{ReturnToCampusDate}}", description: "Return to campus date", real_length: 5 }
  end

  def self.student_name
    { name: "{{StudentName}}", description: "Student Name", real_length: 5 }
  end

  def self.student_email
    { name: "{{StudentEmailAddress}}", description: "Student Email Address", real_length: 5 }
  end

  def self.student_phone_number
    { name: "{{StudentPhoneNumber}}", description: "Student Phone number", real_length: 5 }
  end
  #end validation keys

  #enrollment_sms_text_based
  def self.enrollment_sms_text_based_symbols
    return [initials_age]
  end

  def self.enrollment_sms_text_based_body
    lang = :en
    "#{I18n.t('assessments.sms.prompt.intro1', locale: lang)} {{InitialsAge}} #{I18n.t('assessments.sms.prompt.intro2', locale: lang)}"
  end

  def self.enrollment_sms_text_based_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:enrollment_sms_text_based]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: "",
      body: (content.nil? ? self.enrollment_sms_text_based_body : content.body)
    }
  end

  def self.enrollment_sms_text_based_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    content = self.enrollment_sms_text_based_content(jurisdiction_id)[:body]
    content.gsub("{{InitialsAge}}", patient&.initials_age('-'))
  end
  #end enrollment_sms_text_based

  #assessment_sms_weblink
  def self.assessment_sms_weblink_symbols
    return [initials_age, assessment_link]
  end

  def self.assessment_sms_weblink_body
    lang = :en
    "#{I18n.t('assessments.sms.weblink.intro', locale: lang)} {{InitialsAge}}: {{AssessmentLink}}"
  end

  def self.assessment_sms_weblink_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:assessment_sms_weblink]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: "",
      body: content.nil? ? self.assessment_sms_weblink_body : content.body
    }
  end

  def self.assessment_sms_weblink_message(patient, url)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    content = self.assessment_sms_weblink_content(jurisdiction_id)[:body]
    content.gsub("{{InitialsAge}}", patient&.initials_age('-')).gsub("{{AssessmentLink}}", url)
  end
  #end assessment_sms_weblink

  #monitoring_sms_complete
  def self.monitoring_sms_complete_symbols
    return [initials_age]
  end

  def self.monitoring_sms_complete_body
    "Thank you for using Sara Alert Academic {{InitialsAge}}.  Your monitoring period has been completed."
  end

  def self.monitoring_sms_complete_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:monitoring_sms_complete]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: "",
      body: content.nil? ? self.monitoring_sms_complete_body : content.body
    }
  end

  def self.monitoring_sms_complete_message(patient)
    jurisdiction_id = self.jurisdiction_id(patient.jurisdiction.id)
    content = self.monitoring_sms_complete_content(jurisdiction_id)[:body]
    content.gsub("{{InitialsAge}}", patient&.initials_age('-'))
  end
  #end monitoring_sms_complete

  #enrollment_email
  def self.enrollment_email_symbols
    return [initials_age]
  end

  def self.enrollment_email_subject
    'Sara Alert Academic Enrollment'
  end

  def self.enrollment_email_body
    p %{
      <p>Dear {{InitialsAge}},</p>
      <p>You have been enrolled in the Sara Alert Academic monitoring system. We ask that you provide daily reports of your status. Simply click the button below and follow the on-screen instructions.</p>
      <p>You will receive a similar reminder daily until your monitoring period has ended. If you have any questions please reach out to the student health service that helped enroll you.</p>
      }
  end

  def self.enrollment_email_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:enrollment_email]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: content.nil? ? self.enrollment_email_subject : content.subject,
      body: content.nil? ? self.enrollment_email_body : content.body
    }
  end

  def self.enrollment_email_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    content = self.enrollment_email_content(jurisdiction_id)
    content[:body].gsub!("{{InitialsAge}}", patient&.initials_age('-'))
    content
  end
  #end enrollment_email

  #assessment_email
  def self.assessment_email_symbols
    return [initials_age]
  end

  def self.assessment_email_subject
    'Sara Alert Academic Report Reminder'
  end

  def self.assessment_email_body
    p %{
      <p>Dear {{InitialsAge}},</p>
      <p>Thank you for participating in the Sara Alert Academic monitoring program, please fill out your daily report using the link below.</p>
      }
  end

  def self.assessment_email_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:assessment_email]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: content.nil? ? self.assessment_email_subject : content.subject,
      body: content.nil? ? self.assessment_email_body : content.body
    }
  end

  def self.assessment_email_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    content = self.assessment_email_content(jurisdiction_id)
    content[:body].gsub!("{{InitialsAge}}", patient&.initials_age('-'))
    content
  end
  #end assessment_email

  #monitoring_complete_email
  def self.monitoring_complete_email_symbols
    return [initials_age]
  end

  def self.monitoring_complete_email_subject
    'Sara Alert Academic Enrollment'
  end

  def self.monitoring_complete_email_body
    p %{
      <p>Dear {{InitialsAge}},</p>
      <p>Your Sara Alert Academic monitoring is now complete! Thank you for your participation.</p>
      }
  end

  def self.monitoring_complete_email_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:monitoring_complete_email]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: content.nil? ? self.monitoring_complete_email_subject : content.subject,
      body: content.nil? ? self.monitoring_complete_email_body : content.body
    }
  end

  def self.monitoring_complete_email_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    content = self.monitoring_complete_email_content(jurisdiction_id)
    content[:body].gsub!("{{InitialsAge}}", patient&.initials_age('-'))
    content
  end
  #end monitoring_complete_email

  #shared_footer_text
  def self.shared_footer_text_symbols
    return []
  end

  def self.shared_footer_text_body
    '<p>Do not reply to this email, forward this email, or share this link. This message was automatically generated by the Sara Alert Academic system and is unique and intended only for you. If you wish to stop receiving these notifications or believe that it was a mistake, please contact your local health services. For more info, visit saraalertacademic.org.</p>'
  end

  def self.shared_footer_text_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:shared_footer_text]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: "",
      body: (content.nil? ? self.shared_footer_text_body : content.body)
    }
  end

  def self.shared_footer_text_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    self.shared_footer_text_content(jurisdiction_id)[:body]
  end
  #end shared_footer_text

  #shared_button_text
  def self.shared_button_text_symbols
    return []
  end

  def self.shared_button_text_body
    'Daily Report'
  end

  def self.shared_button_text_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:shared_button_text]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      subject: "",
      body: (content.nil? ? self.shared_button_text_body : content.body)
    }
  end

  def self.shared_button_text_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    self.shared_button_text_content(jurisdiction_id)[:body]
  end
  #end shared_button_text

  #isolation_email
  def self.isolation_email_symbols
    return [symptom_onset_key, isolation_end_key, return_to_campus_date, student_name, student_email, student_phone_number]
  end

  def self.isolation_email_subject
    'Isolation Notification'
  end

  def self.isolation_email_body
    p %{
      <p>Hi,</p>
      <p>The following student has an excused absence for the following dates:</p>
      <p></p>
      <p>{{SymptomOnsetDate}} through {{IsolationEnd}}, return to campus on {{ReturnToCampusDate}}.</p>
      <p></p>
      <p>STUDENT NAME: {{StudentName}}</p>
      <p>STUDENT EMAIL ADDRESS: {{StudentEmailAddress}}</p>
      <p>STUDENT PHONE NUMBER: {{StudentPhoneNumber}}</p>
      <p></p>
      <p>Thank you,</p>
      <p></p>
      <p>Campus Health</p>
      }
  end

  def self.isolation_email_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:isolation_email]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      recipients: content.nil? ? "" : content.recipients,
      subject: content.nil? ? self.isolation_email_subject : content.subject,
      body: content.nil? ? self.isolation_email_body : content.body
    }
  end

  def self.isolation_email_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    begin_excused_date = self.find_begin_excused_date(patient)
    end_excused_date = begin_excused_date + 10.days
    return_to_campus_date = begin_excused_date + 11.days

    content = self.isolation_email_content(jurisdiction_id)
    content[:body].gsub!("{{SymptomOnsetDate}}", begin_excused_date.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{IsolationEnd}}", end_excused_date.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{ReturnToCampusDate}}", return_to_campus_date.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{StudentName}}", "#{patient.first_name} #{patient.last_name}")
    content[:body].gsub!("{{StudentEmailAddress}}", patient.email || "")
    content[:body].gsub!("{{StudentPhoneNumber}}", patient.primary_telephone || "")
    content
  end
  #end isolation_email

  #quarantine_email
  def self.quarantine_email_symbols
    return [last_exposure_key, quarantine_end_key, return_to_campus_date, student_name, student_email, student_phone_number]
  end

  def self.quarantine_email_subject
    'Quarantine Notification'
  end

  def self.quarantine_email_body
    p %{
      <p>Hi,</p>
      <p>The following student has an excused absence for the following dates:</p>
      <p></p>
      <p>{{LastExposureDate}} through {{QuarantineEnd}}, return to campus on {{ReturnToCampusDate}}.</p>
      <p></p>
      <p>STUDENT NAME: {{StudentName}}</p>
      <p>STUDENT EMAIL ADDRESS: {{StudentEmailAddress}}</p>
      <p>STUDENT PHONE NUMBER: {{StudentPhoneNumber}}</p>
      <p></p>
      <p>Thank you,</p>
      <p></p>
      <p>Campus Health</p>
      }
  end

  def self.quarantine_email_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:quarantine_email]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      recipients: content.nil? ? "" : content.recipients,
      subject: content.nil? ? self.quarantine_email_subject : content.subject,
      body: content.nil? ? self.quarantine_email_body : content.body
    }
  end

  def self.quarantine_email_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    begin_excused_date = self.find_begin_excused_date_quarantine(patient)
    end_excused_date = begin_excused_date + 14.days
    return_to_campus_date = begin_excused_date + 15.days

    content = self.quarantine_email_content(jurisdiction_id)
    content[:body].gsub!("{{LastExposureDate}}", begin_excused_date.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{QuarantineEnd}}", end_excused_date.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{ReturnToCampusDate}}", return_to_campus_date.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{StudentName}}", "#{patient.first_name} #{patient.last_name}")
    content[:body].gsub!("{{StudentEmailAddress}}", patient.email || "")
    content[:body].gsub!("{{StudentPhoneNumber}}", patient.primary_telephone || "")
    content
  end
  #end quarantine_email

  #housing_email
  def self.housing_email_symbols
    return [isolation_or_quarantine, todays_date, student_name, student_email, student_phone_number]
  end

  def self.housing_email_subject
    'Housing Notification'
  end

  def self.housing_email_body
    p %{
      <p>Hi,</p>
      <p>The following student has been placed in {{IsolationOrQuarantine}} as of {{TodaysDate}}:</p>
      <p></p>
      <p>STUDENT NAME: {{StudentName}}</p>
      <p>STUDENT EMAIL ADDRESS: {{StudentEmailAddress}}</p>
      <p>STUDENT PHONE NUMBER: {{StudentPhoneNumber}}</p>
      <p></p>
      <p>We will notify you when they are cleared to return to campus.</p>
      <p></p>
      <p>Thank you,</p>
      <p></p>
      <p>Campus Health</p>
      }
  end

  def self.housing_email_content(jurisdiction_id)
    message_type_id = @@ALL_MESSAGES_TYPES[:housing_email]
    jurisdiction_id = self.get_jurisdiction_id(jurisdiction_id)
    content = self.find_custom_message(message_type_id, jurisdiction_id)
    return {
      recipients: content.nil? ? "" : content.recipients,
      subject: content.nil? ? self.housing_email_subject : content.subject,
      body: content.nil? ? self.housing_email_body : content.body
    }
  end

  def self.housing_email_message(patient)
    jurisdiction_id = self.get_jurisdiction_id(patient.jurisdiction.id)
    begin_excused_date = self.find_begin_excused_date(patient)
    end_excused_date = begin_excused_date + 10.days
    return_to_campus_date = begin_excused_date + 11.days

    iso_or_quar = patient.isolation ? "Isolation" : "Quarantine"
    content = self.housing_email_content(jurisdiction_id)
    content[:body].gsub!("{{IsolationOrQuarantine}}", iso_or_quar)
    content[:body].gsub!("{{TodaysDate}}", Date.today.strftime(@@DATE_FORMAT_STR))
    content[:body].gsub!("{{StudentName}}", "#{patient.first_name} #{patient.last_name}")
    content[:body].gsub!("{{StudentEmailAddress}}", patient.email || "")
    content[:body].gsub!("{{StudentPhoneNumber}}", patient.primary_telephone || "")
    content
  end
  #end housing_email

  private

  def self.find_begin_excused_date(p)
    begin_excused_date = nil
    if(p.latest_positive_lab_at.nil? && p.symptom_onset.nil?)
      begin_excused_date = p.created_at
    elsif(p.symptom_onset.nil?)
      begin_excused_date = p.latest_positive_lab_at
    else(p.latest_positive_lab_at.nil?)
      begin_excused_date = p.symptom_onset
    end
    begin_excused_date
  end

  def self.find_begin_excused_date_quarantine(p)
    return p.last_date_of_exposure.nil? ? p.created_at : p.last_date_of_exposure
  end

  def self.get_jurisdiction_id(jurisdiction_id)
    #SAA has a top level jurisdiction per university.  To simplify creating custom notifications, this is what we care about.
    j = Jurisdiction.find jurisdiction_id
    return j.root.id
  end

end

class SaaMailer < ApplicationMailer
  default from: 'support@saraalertacademic.org'

  def contact_us_email(name, email, message)
    @name = name
    @email = email
    @message = message
    mail(to: ADMIN_OPTIONS['contact_us_email'], subject: "Sara Alert Academic Contact Us")
  end

  def self_enrollment_confirmation(to, code)
    @to = to
    @code = code
    mail(to: to, subject: "Sara Alert Academic Confirmation Code")
  end
end

class PasswordsController < ApplicationController

  def new; end

  def create
    flash[:notice] = "We received your password reset request. If your account exists, you will receive instructions in your email."

    user = User.find_by email: params[:email].strip
    unless user.blank?
      user.unlock_access!
      password = User.rand_gen
      user.password = password
      user.force_password_change = true
      user.save!
      UserMailer.welcome_email(user, password).deliver_later
    end

    render :js => "window.location = '/users/sign_in'"
  end

end
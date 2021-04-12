class ContactUsController < ApplicationController

  def show
    #feature hidden for last official release
    head :not_found

    
  end

  def create
    #feature hidden for last official release
    head :not_found
    
    #SaaMailer.contact_us_email(contact_us[:name], contact_us[:email], contact_us[:message]).deliver
    #render json: {success: true}
  end

  private

    # Only allow a list of trusted parameters through.
    def contact_us
      params.require(:contact_us).permit(:email, :name, :message)
    end
end

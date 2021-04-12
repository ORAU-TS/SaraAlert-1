class JurisdictionEmail < ApplicationRecord
  validates :domain, presence: :true

  belongs_to :jurisdiction
end

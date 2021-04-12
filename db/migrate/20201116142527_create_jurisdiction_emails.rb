class CreateJurisdictionEmails < ActiveRecord::Migration[6.0]
  def change
    create_table :jurisdiction_emails do |t|
      t.string :domain
      t.references :jurisdiction, null: false, foreign_key: true
    end
  end
end

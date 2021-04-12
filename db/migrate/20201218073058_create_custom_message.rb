class CreateCustomMessage < ActiveRecord::Migration[6.0]
  def change
    create_table :custom_messages do |t|
      t.string :subject
      t.string :body
      t.integer :message_type
      t.references  :jurisdiction, index: true
    end
  end
end

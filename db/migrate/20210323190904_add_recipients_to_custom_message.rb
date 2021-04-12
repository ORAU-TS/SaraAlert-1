class AddRecipientsToCustomMessage < ActiveRecord::Migration[6.1]
  def change
    add_column :custom_messages, :recipients, :string
  end
end

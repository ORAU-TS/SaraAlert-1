class ChangeCustomMessageBody < ActiveRecord::Migration[6.0]
  def change
    change_column :custom_messages, :body, :text
  end
end

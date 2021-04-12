class AddStringTypeToSymptoms < ActiveRecord::Migration[6.0]
  def change
    add_column :symptoms, :string_value, :string
  end
end

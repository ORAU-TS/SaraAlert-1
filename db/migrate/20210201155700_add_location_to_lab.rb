class AddLocationToLab < ActiveRecord::Migration[6.0]
  def change
    add_column :laboratories, :location, :text
  end
end

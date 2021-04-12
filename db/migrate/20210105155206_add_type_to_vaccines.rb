class AddTypeToVaccines < ActiveRecord::Migration[6.0]
  def change
    add_column :vaccines, :disease, :string
    add_column :vaccines, :vac_type, :string
    add_column :vaccines, :lot_number, :string
  end
end

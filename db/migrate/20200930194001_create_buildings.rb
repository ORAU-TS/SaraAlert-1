class CreateBuildings < ActiveRecord::Migration[6.0]
  def change
    create_table :buildings do |t|
      t.string :name
      t.references :jurisdiction, null: false, foreign_key: true
    end
  end
end

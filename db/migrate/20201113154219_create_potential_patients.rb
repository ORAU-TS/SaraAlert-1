class CreatePotentialPatients < ActiveRecord::Migration[6.0]
  def change
    create_table :potential_patients do |t|
      t.string :first_name, required: true, nullable: false
      t.string :last_name, required: true, nullable: false
      t.string :email, required: true, nullable: false
      t.boolean :exposed, required: true, nullable: false
      t.boolean :tested_positive, required: true, nullable: false
      t.boolean :concerning_symptoms, required: true, nullable: false
      t.string :verification_code, required: true, nullable: false
      t.boolean :confirmed, required: true, nullable: false, default: false
      t.references :jurisdiction, null: false, foreign_key: true
      t.timestamps
    end
  end
end

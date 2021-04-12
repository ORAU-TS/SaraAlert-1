class AddAssessmentToPotentialPatient < ActiveRecord::Migration[6.0]
  def change
    add_column :potential_patients, :assessment, :text
  end
end

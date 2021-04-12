class AddStudentInfoToPatients < ActiveRecord::Migration[6.0]
  def change
    add_column :patients, :saa_student_id, :string
    add_column :patients, :saa_building_name, :string
    add_column :patients, :saa_floor_number, :integer
    add_column :patients, :saa_room_number, :integer
  end
end

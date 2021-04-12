class AddDeptSupervisorProjectFields < ActiveRecord::Migration[6.0]
  def change
    add_column :patients, :department, :string
    add_column :patients, :supervisor, :string
    add_column :patients, :project, :string
  end
end

class AddLastDayOfWorkToPatients < ActiveRecord::Migration[6.0]
  def change
    add_column :patients, :saa_last_day_at_work, :datetime
  end
end

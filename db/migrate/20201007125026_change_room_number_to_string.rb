class ChangeRoomNumberToString < ActiveRecord::Migration[6.0]
  def change
    change_column :patients, :saa_room_number, :string
  end
end

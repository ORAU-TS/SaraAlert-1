class String
  def saa_role_name
    self.sub 'Public Health', 'Student Health'
  end

  def sa_role_name
    self.sub 'Student Health', 'Public Health'
  end
end
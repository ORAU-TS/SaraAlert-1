# frozen_string_literal: true

# StringSymptom: a symptom that contains a string
# Methods that create StringSymptoms should keep the above in mind.
class StringSymptom < Symptom
  # validates :string_value

  def value
    string_value
  end

  def value=(value)
    self.string_value = value
  end

  def negate
    self.string_value = ''
  end

  def as_json(options = {})
    super(options).merge({
                           value: string_value
                         })
  end
end

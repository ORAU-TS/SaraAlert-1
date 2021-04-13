export const HasOverlap = patient => {
  const symptom_onset = patient.symptom_onset;
  const saa_last_day_at_work = patient.saa_last_day_at_work;
  const continuous_exposure = patient.continuous_exposure;

  const overlapWindowStartDays = 2;
  const overlapWindowLength = 14;

  if (!saa_last_day_at_work) {
    return false;
  }

  if (saa_last_day_at_work && continuous_exposure) {
    return true;
  }
  const date_symptom_onset = new Date(symptom_onset);
  date_symptom_onset.setDate(date_symptom_onset.getDate() - overlapWindowStartDays);
  const date_last_day = new Date(saa_last_day_at_work);
  const diffTime = Math.abs(date_symptom_onset - date_last_day);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= overlapWindowLength && date_symptom_onset <= date_last_day;
};

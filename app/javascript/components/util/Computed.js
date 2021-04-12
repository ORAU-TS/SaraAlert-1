export const HasOverlap = patient => {
  const last_date_of_exposure = patient.last_date_of_exposure;
  const saa_last_day_at_work = patient.saa_last_day_at_work;
  const continuous_exposure = patient.continuous_exposure;

  if (!saa_last_day_at_work) {
    return false;
  }

  if (saa_last_day_at_work && continuous_exposure) {
    return true;
  }
  const date_exposure = new Date(last_date_of_exposure);
  const date_last_day = new Date(saa_last_day_at_work);
  const diffTime = Math.abs(date_exposure - date_last_day);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 14 && date_exposure <= date_last_day;
};

import { useState, useEffect } from "react";
import { getCultures } from "../api/cultureService";

export default function useCultures() {
  const [cultures, setCultures] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getCultures()
      .then((res) => setCultures(res.data.data.cultures || []))
      .catch(() => setCultures([]))
      .finally(() => setLoading(false));
  }, []);

  return { cultures, loading };
}
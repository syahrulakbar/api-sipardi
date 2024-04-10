const supabase = require("../utils/supabase");

exports.getAllData = async (req, res) => {
  try {
    // Mengambil data dari tabel users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("role", "1");

    if (userError) {
      console.error("Error fetching users data:", userError.message);
    }

    // Mengambil data dari tabel gejala
    const { data: gejalaData, error: gejalaError } = await supabase.from("gejalas").select("id");

    if (gejalaError) {
      console.error("Error fetching gejala data:", gejalaError.message);
    }
    const { data: penyakitData, error: penyakitError } = await supabase
      .from("penyakits")
      .select("id");

    if (penyakitError) {
      console.error("Error fetching gejala data:", gejalaError.message);
    }

    // Mengambil data dari tabel rules
    const { data: rulesData, error: rulesError } = await supabase.from("rules").select("id");

    if (rulesError) {
      console.error("Error fetching rules data:", rulesError.message);
    }
    return res.status(200).json({
      message: "Get all data rule successfully",
      data: {
        gejala: gejalaData.length,
        rules: rulesData.length,
        user: userData.length,
        penyakit: penyakitData.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while get data rule" });
  }
};

exports.createRule = async (req, res) => {
  try {
    const { penyakit_id, gejala_ids } = req.body;
    const { data: penyakit, error } = await supabase
      .from("penyakits")
      .select("*")
      .eq("id", penyakit_id)
      .single();
    if (error || !penyakit) {
      return res.status(404).json({ message: "Penyakit not found" });
    }

    const { data: rule, error: errorData } = await supabase
      .from("rules")
      .insert({ penyakit_id })
      .select()
      .single();
    if (errorData) {
      throw new Error(errorData.message);
    }

    const { error: addGejalaError } = await supabase
      .from("Rule_Gejala")
      .insert(gejala_ids.map((gejalaId) => ({ rule_id: rule.id, gejalaId })));

    if (addGejalaError) {
      throw new Error(addGejalaError.message);
    }

    const { data: createdRule, error: createdRuleError } = await supabase
      .from("rules")
      .select(`*,gejalas(id, nama_gejala)`)
      .eq("id", rule.id)
      .single();
    if (createdRuleError) {
      throw new Error(createdRuleError.message);
    }

    return res.status(201).json(createdRule);
  } catch (error) {
    console.error("Error while creating rule:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllRule = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    const { data, error } = await supabase
      .from("rules")
      .select(
        `
      *,
      penyakits:penyakit_id(id, nama_penyakit),
      gejalas(id, nama_gejala)
    `,
      )
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const filteredData = data.filter((rule) =>
      rule.penyakits.nama_penyakit.toLowerCase().includes(keyword.toLowerCase()),
    );

    return res.status(200).json({
      message: "Get all data rule successfully",
      data: filteredData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while get data rule" });
  }
};

exports.matchSymptoms = async (req, res) => {
  try {
    const userSymptoms = req.body.gejala_ids;
    if (!userSymptoms || userSymptoms.length === 0) {
      return res.status(400).json({ message: "Gejala tidak boleh kosong" });
    }

    const { data: ruleSymptoms, error } = await supabase.from("rules").select(`
    *,gejalas(id, nama_gejala),penyakits:penyakit_id(*)
    `);
    if (error) {
      throw new Error(error.message);
    }

    for (const rule of ruleSymptoms) {
      const ruleSymptoms = rule.gejalas.map((gejala) => gejala.id);
      const matched =
        userSymptoms.length === ruleSymptoms.length &&
        userSymptoms.every((symptom) => ruleSymptoms.includes(symptom));

      if (matched) {
        await supabase.from("konsultasis").insert({ rule_id: rule.id, user_id: req.userId });
        return res.status(200).json({
          message: "Diagnose success! Gejala matched with rule!",
          data: {
            matched: true,
            rule: rule,
          },
        });
      }
    }

    return res.status(200).json({
      message: "Gejala not found in any rule",
      data: {
        matched: false,
        rule: null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while matching symptoms" });
  }
};

exports.getRuleById = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: rule, error } = await supabase
      .from("rules")
      .select(`*,penyakits:penyakit_id(id, nama_penyakit), gejalas(id,nama_gejala)`)
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (rule) {
      return res.status(200).json({
        message: "Get data rule by id successfully",
        data: rule,
      });
    } else {
      return res.status(404).json({
        message: "data rule not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: error?.message || "Error while get data rule by id" });
  }
};

exports.deleteRule = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: rule, error } = await supabase.from("rules").select(`*`).eq("id", id).single();
    if (error) {
      throw new Error(error.message);
    }
    if (rule) {
      await supabase.from("rules").delete().eq("id", id);
      return res.status(200).json({
        message: "Delete data rule successfully",
      });
    } else {
      return res.status(404).json({
        message: "data rule not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: error?.message || "Error while delete data rule" });
  }
};

exports.updateRule = async (req, res) => {
  const id = req.params.id;
  try {
    const { penyakit_id, gejala_ids } = req.body;
    const { data: rule, error } = await supabase.from("rules").select(`*`).eq("id", id).single();

    if (error || !rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    if (penyakit_id) {
      const { data: penyakit, error } = await supabase
        .from("rules")
        .select(`*`)
        .eq("penyakit_id", penyakit_id)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      if (!penyakit) {
        return res.status(404).json({ message: "Penyakit not found" });
      }
      rule.penyakit_id = penyakit_id;
    }

    if (gejala_ids) {
      const { error } = await supabase.from("Rule_Gejala").upsert(
        gejala_ids.map((gejalaId) => ({ rule_id: rule.id, gejalaId })),
        { onConflict: ["rule_id", "gejalaId"], ignoreDuplicates: true },
      );
      if (error) {
        throw new Error(error.message);
      }
    }

    const { error: saveError } = await supabase.from("rules").upsert(rule);
    if (saveError) {
      throw new Error(saveError.message);
    }

    const { data: updatedRule, error: updateError } = await supabase
      .from("rules")
      .select(`*, gejalas(id, nama_gejala)`)
      .eq("id", id)
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return res.status(200).json(updatedRule);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while data rule" });
  }
};

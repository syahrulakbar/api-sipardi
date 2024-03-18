// const db = require("../models");
// const Rule = db.rule;
// const Penyakit = db.penyakit;
// const Gejala = db.gejala;
// const Konsultasi = db.konsultasi;
// const { Op } = require("sequelize");
const supabase = require("../utils/supabase");

exports.createRule = async (req, res) => {
  try {
    // Destructure data dari body request
    const { penyakit_id, gejala_ids } = req.body;

    // const penyakit = await Penyakit.findByPk(penyakit_id);
    const { data: penyakit, error } = await supabase
      .from("penyakits")
      .select("*")
      .eq("id", penyakit_id)
      .single();
    if (error || !penyakit) {
      return res.status(404).json({ message: "Penyakit not found" });
    }

    // Buat aturan baru dengan ID Penyakit yang terkait
    // const rule = await Rule.create({ penyakit_id });
    const { data: rule, error: errorData } = await supabase
      .from("rules")
      .insert({ penyakit_id })
      .select()
      .single();
    if (errorData) {
      throw new Error(errorData.message);
    }
    // Tambahkan gejala-gejala yang terkait dengan aturan baru
    // await rule.addGejalas(gejala_ids);
    // const { error: addGejalaError } = await supabase
    //   .from("rules")
    //   .upsert({ gejala_ids })
    //   .eq("id", rule.id);

    const { error: addGejalaError } = await supabase
      .from("Rule_Gejala") // Assuming you have a join table named rule_gejala
      .insert(gejala_ids.map((gejalaId) => ({ rule_id: rule.id, gejalaId })));

    if (addGejalaError) {
      throw new Error(addGejalaError.message);
    }

    // Ambil data aturan yang baru saja dibuat beserta gejalanya
    // const createdRule = await Rule.findByPk(rule.id, {
    //   include: [{ model: Gejala, attributes: ["id", "nama_gejala"] }],
    // });
    const { data: createdRule, error: createdRuleError } = await supabase
      .from("rules")
      .select(`*,gejalas(id, nama_gejala)`)
      .eq("id", rule.id)
      .single();
    if (createdRuleError) {
      throw new Error(createdRuleError.message);
    }
    // Kirim respons dengan data aturan yang baru saja dibuat
    return res.status(201).json(createdRule);
  } catch (error) {
    console.error("Error while creating rule:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllRule = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    // const data = await Rule.findAll({
    //   include: [
    //     {
    //       model: Penyakit,
    //       attributes: ["id", "nama_penyakit"],
    //       where: {
    //         nama_penyakit: {
    //           [Op.iLike]: `%${keyword}%`,
    //         },
    //       },
    //     },
    //     {
    //       model: Gejala,
    //       attributes: ["id", "nama_gejala"],
    //     },
    //   ],
    //   order: [["id", "ASC"]],
    // });

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

    // const ruleSymptoms = await Rule.findAll({
    //   include: [
    //     { model: Gejala, attributes: ["id", "nama_gejala"] },
    //     {
    //       model: Penyakit, // Menambahkan model Penyakit ke dalam include
    //     },
    //   ],
    // });

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
        // await Konsultasi.create({ rule_id: rule.id, user_id: req.userId });
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
    // const rule = await Rule.findOne({
    //   include: [
    //     {
    //       model: Penyakit,
    //       attributes: ["id", "nama_penyakit"],
    //     },
    //     {
    //       model: Gejala,
    //       attributes: ["id", "nama_gejala"],
    //     },
    //   ],
    //   where: {
    //     id,
    //   },
    // });

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
    // const rule = await Rule.findByPk(id);
    const { data: rule, error } = await supabase.from("rules").select(`*`).eq("id", id).single();
    if (error) {
      throw new Error(error.message);
    }
    if (rule) {
      // await rule.destroy({ where: { id } });
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
    // const rule = await Rule.findByPk(id);
    const { data: rule, error } = await supabase.from("rules").select(`*`).eq("id", id).single();

    if (error || !rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    if (penyakit_id) {
      // const penyakit = await Penyakit.findByPk(penyakit_id);
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
      // await rule.setGejalas([]);
      // await rule.setGejalas(gejala_ids);
      // await supabase.from("rules").update([]).eq("id", id);
      // await supabase.from("rules").update({ gejala_ids }).eq("id", id);
      const { error } = await supabase.from("Rule_Gejala").upsert(
        gejala_ids.map((gejalaId) => ({ rule_id: rule.id, gejalaId })),
        { onConflict: ["rule_id", "gejalaId"], ignoreDuplicates: true },
      );
      if (error) {
        throw new Error(error.message);
      }
    }

    // await rule.save();
    const { error: saveError } = await supabase.from("rules").upsert(rule);
    if (saveError) {
      throw new Error(saveError.message);
    }

    // const updatedRule = await Rule.findByPk(id, {
    //   include: [{ model: Gejala, attributes: ["id", "nama_gejala"] }],
    // });
    const { data: updatedRule, error: updateError } = await supabase
      .from("rules")
      .select(`*, gejalas(id, nama_gejala)`)
      .eq("id", id)
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Return the updated rule in the response
    return res.status(200).json(updatedRule);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while data rule" });
  }
};

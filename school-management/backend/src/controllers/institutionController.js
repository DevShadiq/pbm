import pool from "../config/db.js";

const institutionColumns = `
  institution_id,
  institution_code,
  institution_name,
  institution_name_bn,
  short_name_bn,
  institution_type,
  eiin_no,
  registration_no,
  phone,
  phone_bn,
  email,
  website,
  logo_url,
  address_line,
  address_line_bn,
  district_bn,
  upazila_bn,
  post_office_bn,
  status,
  created_at,
  updated_at
`;

const sendServerError = (res, error) => {
  console.error(error);

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Institution code already exists.",
    });
  }

  if (error.code === "23514") {
    return res.status(400).json({
      success: false,
      message: "Invalid status value. Status must be ACTIVE or INACTIVE.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
};

const validateInstitution = (body) => {
  const errors = [];

  if (!body.institution_code || !body.institution_code.trim()) {
    errors.push("Institution code is required.");
  }

  if (!body.institution_name || !body.institution_name.trim()) {
    errors.push("Institution name is required.");
  }

  if (!body.institution_type || !body.institution_type.trim()) {
    errors.push("Institution type is required.");
  }

  if (body.status && !["ACTIVE", "INACTIVE"].includes(body.status)) {
    errors.push("Status must be ACTIVE or INACTIVE.");
  }

  return errors;
};

export const getInstitutions = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT ${institutionColumns}
      FROM sms.institutions
      ORDER BY institution_id DESC
      `
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const getInstitutionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT ${institutionColumns}
      FROM sms.institutions
      WHERE institution_id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Institution not found.",
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const createInstitution = async (req, res) => {
  try {
    const errors = validateInstitution(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const {
      institution_code,
      institution_name,
      institution_name_bn,
      short_name_bn,
      institution_type,
      eiin_no,
      registration_no,
      phone,
      phone_bn,
      email,
      website,
      logo_url,
      address_line,
      address_line_bn,
      district_bn,
      upazila_bn,
      post_office_bn,
      status = "ACTIVE",
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO sms.institutions (
        institution_code,
        institution_name,
        institution_name_bn,
        short_name_bn,
        institution_type,
        eiin_no,
        registration_no,
        phone,
        phone_bn,
        email,
        website,
        logo_url,
        address_line,
        address_line_bn,
        district_bn,
        upazila_bn,
        post_office_bn,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18
      )
      RETURNING ${institutionColumns}
      `,
      [
        institution_code.trim(),
        institution_name.trim(),
        institution_name_bn || null,
        short_name_bn || null,
        institution_type.trim(),
        eiin_no || null,
        registration_no || null,
        phone || null,
        phone_bn || null,
        email || null,
        website || null,
        logo_url || null,
        address_line || null,
        address_line_bn || null,
        district_bn || null,
        upazila_bn || null,
        post_office_bn || null,
        status,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Institution created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const errors = validateInstitution(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const {
      institution_code,
      institution_name,
      institution_name_bn,
      short_name_bn,
      institution_type,
      eiin_no,
      registration_no,
      phone,
      phone_bn,
      email,
      website,
      logo_url,
      address_line,
      address_line_bn,
      district_bn,
      upazila_bn,
      post_office_bn,
      status = "ACTIVE",
    } = req.body;

    const result = await pool.query(
      `
      UPDATE sms.institutions
      SET
        institution_code = $1,
        institution_name = $2,
        institution_name_bn = $3,
        short_name_bn = $4,
        institution_type = $5,
        eiin_no = $6,
        registration_no = $7,
        phone = $8,
        phone_bn = $9,
        email = $10,
        website = $11,
        logo_url = $12,
        address_line = $13,
        address_line_bn = $14,
        district_bn = $15,
        upazila_bn = $16,
        post_office_bn = $17,
        status = $18,
        updated_at = NOW()
      WHERE institution_id = $19
      RETURNING ${institutionColumns}
      `,
      [
        institution_code.trim(),
        institution_name.trim(),
        institution_name_bn || null,
        short_name_bn || null,
        institution_type.trim(),
        eiin_no || null,
        registration_no || null,
        phone || null,
        phone_bn || null,
        email || null,
        website || null,
        logo_url || null,
        address_line || null,
        address_line_bn || null,
        district_bn || null,
        upazila_bn || null,
        post_office_bn || null,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Institution not found.",
      });
    }

    return res.json({
      success: true,
      message: "Institution updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

export const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM sms.institutions
      WHERE institution_id = $1
      RETURNING institution_id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Institution not found.",
      });
    }

    return res.json({
      success: true,
      message: "Institution deleted successfully.",
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

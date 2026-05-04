const formsService = require('../services/forms.service');

/**
 * GET /api/forms/:subCriteriaCode
 */
async function getForm(req, res, next) {
  try {
    const data = await formsService.getFormBySubCriteria(
      req.user.id,
      req.params.subCriteriaCode
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/forms/submit/:subCriteriaCode
 * Body: { form_data: {...}, action: 'draft' | 'submit' }
 */
async function submitForm(req, res, next) {
  try {
    const { form_data, action = 'draft' } = req.body;

    if (!form_data) {
      return res.status(400).json({ success: false, message: 'form_data is required.' });
    }

    const data = await formsService.saveForm(
      req.user.id,
      req.params.subCriteriaCode,
      form_data,
      action
    );

    res.status(action === 'submit' ? 200 : 201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/forms/:submissionId
 * Body: { form_data: {...}, action: 'draft' | 'submit' }
 */
async function updateForm(req, res, next) {
  try {
    const { form_data, action = 'draft' } = req.body;

    if (!form_data) {
      return res.status(400).json({ success: false, message: 'form_data is required.' });
    }

    const data = await formsService.updateForm(
      req.user.id,
      req.params.submissionId,
      form_data,
      action
    );

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getForm, submitForm, updateForm };

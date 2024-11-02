// @ts-check
import { E, Far } from '@endo/far';
import { M } from '@endo/patterns';
import '@agoric/zoe/exported.js';
/**
 * @typedef {{
 * maxPatients: bigint;
 * }} PatientTerms
 */

export const meta = {
  customTermsShape: M.splitRecord({
    maxPatients: M.bigint(),
  }),
};

/**
 * @param {ZCF<PatientTerms>} zcf
 */
export const start = async (zcf, privateArgs) => {
  const { maxPatients } = zcf.getTerms();
  let patientCount = 0n;

  // Create storage node for patient data
  const patientDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'patients',
  );

  /**
   * Get current patient count from storage
   * @returns {bigint}
   */
  const getPatientCount = () => patientCount;

  /**
   * Update patient count in storage
   */
  const incrementPatientCount = () => {
    patientCount += 1n;
    return patientCount;
  };

  /**
   * Store patient data in VStorage
   * @param {string} patientId
   * @param {object} data
   */
  const storePatientData = async (patientId, data) => {
    const patientNode = await E(patientDataRoot).makeChildNode(patientId);
    await E(patientNode).setValue(JSON.stringify(data));
  };

  /**
   * Check if patient already exists
   * @param {string} patientId
   * @returns {Promise<boolean>}
   */
  const patientExists = async patientId => {
    try {
      const patientNode = await E(patientDataRoot).makeChildNode(patientId);
      const existingData = await E(patientNode).getValue();
      return existingData !== null && existingData !== undefined;
    } catch {
      return false;
    }
  };

  /**
   * Validate patient data structure
   * @param {object} data
   */
  const validatePatientData = data => {
    const requiredFields = ['patientId', 'name', 'age', 'gender', 'bloodType'];
    return requiredFields.every(
      field =>
        Object.prototype.hasOwnProperty.call(data, field) &&
        data[field] !== null &&
        data[field] !== undefined,
    );
  };

  const proposalShape = harden({
    exit: M.any(),
    give: M.any(),
    want: M.any(),
  });

  /**
   * Handle publishing of patient data
   * @param {ZCFSeat} seat
   * @param {object} offerArgs
   */
  const publishHandler = async (seat, offerArgs) => {
    const { patientData } = offerArgs;

    // Validate data structure
    if (!validatePatientData(patientData)) {
      console.error('Invalid patient data structure');
      return harden(new Error('Invalid patient data structure'));
    }

    try {
      // Check if adding a new patient (not updating existing)
      const isNewPatient = !(await patientExists(patientData.patientId));

      // Check maxPatients limit for new patients
      if (isNewPatient && getPatientCount() >= maxPatients) {
        console.error('Maximum number of patients reached');
        return harden(new Error('Maximum number of patients reached'));
      }

      // Store the patient data
      await storePatientData(patientData.patientId, patientData);

      // Update patient count for new patients
      if (isNewPatient) {
        incrementPatientCount();
      }

      seat.exit();
      return 'Patient data published successfully';
    } catch (error) {
      console.error('Error publishing patient data:', error);
      return harden(new Error('Failed to publish patient data'));
    }
  };

  const makePublishInvitation = () =>
    zcf.makeInvitation(
      publishHandler,
      'publish patient data',
      undefined,
      proposalShape,
    );

  return harden({
    publicFacet: Far('Patient Data Public Facet', {
      makePublishInvitation,
    }),
  });
};

harden(start);

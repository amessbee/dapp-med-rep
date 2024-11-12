import { useEffect, useState } from 'react';
import {
  makeAgoricChainStorageWatcher,
  AgoricChainStoragePathKind as Kind,
} from '@agoric/rpc';
import { create } from 'zustand';
import {
  makeAgoricWalletConnection,
  suggestChain,
} from '@agoric/web-components';
import {
  Activity,
  Heart,
  UserCircle,
  Wallet,
  ClipboardList,
  User,
  LogOut,
  Building,
  GraduationCap,
  Award,
  School,
  FileText,
  BookOpen,
  Scroll,
  UserCheck,
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PublicCertificateView } from './components/publicCertificateView';
import defaultSignature from '/signs_small.jpg';
import defaultLogo from '/agoric_small.jpg';


const ENDPOINTS = {
  RPC: 'http://localhost:26657',
  API: 'http://localhost:1317',
};

const watcher = makeAgoricChainStorageWatcher(ENDPOINTS.API, 'agoriclocal');

interface AppState {
  wallet?: any;
  patientContractInstance?: unknown;
  brands?: Record<string, unknown>;
}

const useAppStore = create<AppState>(() => ({}));

const setup = async () => {
  watcher.watchLatest<Array<[string, unknown]>>(
    [Kind.Data, 'published.agoricNames.instance'],
    instances => {
      useAppStore.setState({
        patientContractInstance: instances
          .find(([name]) => name === 'EdCert')!
          .at(1),
      });
    },
  );

  watcher.watchLatest<Array<[string, unknown]>>(
    [Kind.Data, 'published.agoricNames.brand'],
    brands => {
      useAppStore.setState({
        brands: Object.fromEntries(brands),
      });
    },
  );
};

const connectWallet = async () => {
  await suggestChain('https://local.agoric.net/network-config');
  const wallet = await makeAgoricWalletConnection(watcher, ENDPOINTS.RPC);
  useAppStore.setState({ wallet });
};

const disconnectWallet = () => {
  useAppStore.setState({ wallet: undefined });
};

const publishEdCert = (certificate: any) => {
  const { wallet, patientContractInstance } = useAppStore.getState();
  if (!patientContractInstance) {
    toast.error('No instance of Smart Contract found on chain!', {
      duration: 10000,
      position: 'bottom-right',
    });
    return;
  }

  console.log(certificate);
  wallet?.makeOffer(
    {
      source: 'contract',
      instance: patientContractInstance,
      publicInvitationMaker: 'makePublishInvitation',
      "fee": {
    "gas": "400000",
    "amount": [
      {
        "amount": "0",
        "denom": "uist"
      }
    ]
  },
    },
    {}, // No assets being exchanged
    {
      edCert: certificate,
    },
    (update: { status: string; data?: unknown }) => {
      if (update.status === 'error') {
        toast.error(`Publication error: ${update.data}`, {
          duration: 10000,
          position: 'bottom-right',
        });
      }
      if (update.status === 'accepted') {
        toast.success('Data published successfully', {
          duration: 10000,
          position: 'bottom-right',
        });
      }
      if (update.status === 'refunded') {
        toast.error('Publication rejected', {
          duration: 10000,
          position: 'bottom-right',
        });
      }
    },
  );
};

const updateCertificate = (certificateId: string, certificate: any) => {
  const { wallet, patientContractInstance } = useAppStore.getState();
  if (!patientContractInstance) {
    toast.error('No instance of Smart Contract found on chain!', {
      duration: 10000,
      position: 'bottom-right',
    });
    return;
  }

  wallet?.makeOffer(
    {
      source: 'contract',
      instance: patientContractInstance,
      publicInvitationMaker: 'makePublishInvitation',
      fee: {
        gas: 10_000_000,
        // price: 0.001,
      },
    },
    {}, // No assets being exchanged
    {
      certificate: certificate,
    },
    (update: { status: string; data?: unknown }) => {
      if (update.status === 'error') {
        toast.error(`Update error: ${update.data}`, {
          duration: 10000,
          position: 'bottom-right',
        });
      }
      if (update.status === 'accepted') {
        toast.success('Data updated successfully', {
          duration: 10000,
          position: 'bottom-right',
        });
      }
      if (update.status === 'refunded') {
        toast.error('Update rejected', {
          duration: 10000,
          position: 'bottom-right',
        });
      }
    },
  );
};

const EdCertForm = () => {
  const [formData, setFormData] = useState({
    certificateId: 'CERT-2024-002',
    studentName: 'John Doe',
    courseName: 'Orchestration Hackathon',
    startDate: '2024-09-01',
    endDate: '2024-10-30',
    instituteName: 'Agoric',
    instituteAddress: '123 University Ave, Agoric University, TC 12345',
    certifyingAuthority: 'Jovonni Smith Martinez',
    authorityDesignation: 'Dev Relations Engineer',
    authoritySignature: defaultSignature,
    instituteLogo: defaultLogo,
    grade: 'A',
    achievements: 'Runner Up in Orchestration Hackathon 2024',
    specialization: 'Staking and Governance',
    certificateType: 'workshop',
  });

  useEffect(() => {
    setup();
  }, []);

  const { wallet } = useAppStore(({ wallet }) => ({
    wallet,
  }));

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    publishEdCert(formData);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form">
        <div className="sections-container">
          {/* Basic Information */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                Basic Information <FileText className="icon" />
              </h2>
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="label">Certificate ID</label>
                <input
                  type="text"
                  name="certificateId"
                  value={formData.certificateId}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field">
                <label className="label">Student Name</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field">
                <label className="label">Certificate Type</label>
                <select
                  name="certificateType"
                  value={formData.certificateType}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="workshop">Workshop</option>
                  <option value="degree">Degree</option>
                  <option value="diploma">Diploma</option>
                  <option value="short-course">Short Course</option>
                  <option value="completion">Completion</option>
                  <option value="attendance">Attendance</option>
                  <option value="participation">Participation</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Course/Degree Name</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Authority Information */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                Authority Information <UserCheck className="icon" />
              </h2>
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="label">Certifying Authority</label>
                <input
                  type="text"
                  name="certifyingAuthority"
                  value={formData.certifyingAuthority}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field">
                <label className="label">Authority Designation</label>
                <input
                  type="text"
                  name="authorityDesignation"
                  value={formData.authorityDesignation}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field photo-field">
                <label className="label">Authority Signature</label>
                <div className="photo-upload-container">
                  {formData.authoritySignature && (
                    <img 
                      src={formData.authoritySignature} 
                      alt="Authority Signature" 
                      className="photo-preview"
                      style={{ maxWidth: '150px', marginBottom: '10px' }} 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            authoritySignature: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Institute Information */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                Institute Information <School className="icon" />
              </h2>
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="label">Institute Name</label>
                <input
                  type="text"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field photo-field">
                <label className="label">Institute Logo</label>
                <div className="photo-upload-container">
                  {formData.instituteLogo && (
                    <img 
                      src={formData.instituteLogo} 
                      alt="Institute Logo" 
                      className="photo-preview"
                      style={{ maxWidth: '150px', marginBottom: '10px' }} 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            instituteLogo: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="input"
                  />
                </div>
                <div className="field">
                <label className="label">Institute Address</label>
                <input
                  type="text"
                  name="instituteAddress"
                  value={formData.instituteAddress}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                Academic Information <BookOpen className="icon" />
              </h2>
            </div>
            <div className="field-grid">
              <div className="field">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div className="field">
                <label className="label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              
              <div className="field">
                <label className="label">Achievements</label>
                <textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  className="textarea"
                  rows={4}
                  required
                />
              </div>
              <div className="field">
                <label className="label">Specialization</label>
                <textarea
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="textarea"
                  rows={4}
                  required
                />
              </div>
              <div className="field">
                <label className="label">Grade/GPA/Percentage/Score</label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`submit-button ${!wallet ? 'disabled' : ''}`}
          disabled={!wallet}
        >
          <Award className="icon" />
          <span>Publish Certificate</span>
        </button>
      </form>
    </div>
  );
};

const UpdateCertificateForm = () => {
  const [certificates, setCertificates] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    certificateId: '',
    studentName: '',
    courseName: '',
    startDate: '',
    endDate: '',
    instituteName: '',
    instituteAddress: '',
    certifyingAuthority: '',
    authorityDesignation: '',
    authoritySignature: '',
    instituteLogo: '',
    grade: '',
    achievements: '',
    specialization: '',
    certificateType: 'degree',
  });

  const { wallet } = useAppStore(({ wallet }) => ({
    wallet,
  }));

  // Fetch certificate list
  useEffect(() => {
    const fetchCertificateList = async () => {
      const response = await fetch(
        `${ENDPOINTS.API}/agoric/vstorage/children/published.EdCert.certificates`,
      );
      const data = await response.json();
      setCertificates(data.children);
    };
    fetchCertificateList();
  }, []);

  // Fetch certificate data when selected
  const handleCertificateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const certificateId = e.target.value;
    if (!certificateId) return;

    const response = await fetch(
      `${ENDPOINTS.API}/agoric/vstorage/data/published.EdCert.certificates.${certificateId}`,
    );
    const data = await response.json();
    const parsedData = JSON.parse(data.value).values[0];
    const certificate = JSON.parse(parsedData);
    setFormData(certificate);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCertificate(formData.certificateId, formData);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="form">
        <div className="certificate-selector">
          <label className="label">Select Certificate to Update</label>
          <select
            className="input"
            value={formData.certificateId}
            onChange={handleCertificateSelect}
            required
          >
            <option value="">Select a certificate</option>
            {certificates.map(certificateId => (
              <option key={certificateId} value={certificateId}>
                {certificateId}
              </option>
            ))}
          </select>
        </div>

        <div className="sections-container">
          {/* Personal Information */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                Personal Information <UserCheck className="icon" />
              </h2>
            </div>
            <div className="field-grid">
              {/* Certificate ID - readonly since it's selected above */}
              <div className="field">
                <label className="label">Certificate ID</label>
                <input
                  type="text"
                  name="certificateId"
                  value={formData.certificateId}
                  className="input"
                  disabled
                />
              </div>
              {/* Student Name */}
              <div className="field">
                <label className="label">Student Name</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Course/Degree Name */}
              <div className="field">
                <label className="label">Course/Degree Name</label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Start Date */}
              <div className="field">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* End Date */}
              <div className="field">
                <label className="label">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Institute Name */}
              <div className="field">
                <label className="label">Institute Name</label>
                <input
                  type="text"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Institute Address */}
              <div className="field">
                <label className="label">Institute Address</label>
                <input
                  type="text"
                  name="instituteAddress"
                  value={formData.instituteAddress}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Certifying Authority */}
              <div className="field">
                <label className="label">Certifying Authority</label>
                <input
                  type="text"
                  name="certifyingAuthority"
                  value={formData.certifyingAuthority}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Authority Designation */}
              <div className="field">
                <label className="label">Authority Designation</label>
                <input
                  type="text"
                  name="authorityDesignation"
                  value={formData.authorityDesignation}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Authority Signature */}
              <div className="field photo-field">
                <label className="label">Authority Signature</label>
                <div className="photo-upload-container">
                  {formData.authoritySignature && (
                    <img 
                      src={formData.authoritySignature} 
                      alt="Authority Signature" 
                      className="photo-preview"
                      style={{ maxWidth: '150px', marginBottom: '10px' }} 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            authoritySignature: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="input"
                  />
                </div>
              </div>
              {/* Institute Logo */}
              <div className="field photo-field">
                <label className="label">Institute Logo</label>
                <div className="photo-upload-container">
                  {formData.instituteLogo && (
                    <img 
                      src={formData.instituteLogo} 
                      alt="Institute Logo" 
                      className="photo-preview"
                      style={{ maxWidth: '150px', marginBottom: '10px' }} 
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData(prev => ({
                            ...prev,
                            instituteLogo: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="input"
                  />
                </div>
              </div>
              {/* Grade */}
              <div className="field">
                <label className="label">Grade</label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              {/* Achievements */}
              <div className="field">
                <label className="label">Achievements</label>
                <textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  className="textarea"
                  rows={4}
                />
              </div>
              {/* Specialization */}
              <div className="field">
                <label className="label">Specialization</label>
                <textarea
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="textarea"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`submit-button ${!wallet || !formData.certificateId ? 'disabled' : ''}`}
          disabled={!wallet || !formData.certificateId}
        >
          <Award className="icon" />
          <span>Update Certificate</span>
        </button>
      </form>
    </div>
  );
};

interface Certificate {
  certificateId: string;
  studentName: string;
  courseName: string;
  startDate: string;
  endDate: string;
  instituteName: string;
  instituteAddress: string;
  certifyingAuthority: string;
  authorityDesignation: string;
  authoritySignature: string;
  instituteLogo: string;
  grade: string;
  achievements: string;
  specialization: string;
  certificateType: string;
}

const CertificateTab = () => {
  const [certificates, setCertificates] = useState<string[]>([]);
  const [selectedCertificateId, setSelectedCertificateId] = useState<Certificate | null>(null);

  // Fetch certificate list
  useEffect(() => {
    const fetchCertificateList = async () => {
      const response = await fetch(
        `${ENDPOINTS.API}/agoric/vstorage/children/published.EdCert.certificates`,
      );
      const data = await response.json();
      setCertificates(data.children);
      console.log(data.children);
    };
    fetchCertificateList();
  }, []);

  // Fetch individual certificate data
  const fetchCertificate = async (certificateId: string) => {
    try {
      setSelectedCertificateId(certificateId);
      const response = await fetch(
        `${ENDPOINTS.API}/agoric/vstorage/data/published.EdCert.certificates.${certificateId}`,
      );
      const data = await response.json();
      const parsedData = JSON.parse(data.value);
      const certificate = JSON.parse(parsedData.values[0]);
      setSelectedCertificateId(certificate);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      toast.error('Error fetching certificate details', {
        duration: 5000,
        position: 'bottom-right',
      });
    }
  };

  return (
    <div className="view-container">
      <div className="certificate-list-container">
        <h2 className="section-title">
          <Scroll className="icon" /> Certificates List
        </h2>
        <ul className="certificate-list">
          {certificates.map(certificateId => (
            <li key={certificateId}>
              <div
                onClick={() => fetchCertificate(certificateId)}
                className={`certificate-item ${certificateId === selectedCertificateId?.certificateId ? 'highlighted' : ''}`}
              >
                <Award className="icon" />
                {certificateId}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedCertificateId && (
        <div className="certificate-details">
          <h3 className="details-title">Certificate Details</h3>
          <div className="details-card">
            <div className="sections-container">
              {/* Personal Information Section */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    Personal Information <UserCheck className="icon" />
                  </h2>
                </div>
                <div className="field-grid">
                  <div className="field photo-field">
                    {selectedCertificateId.instituteLogo && (
                      <img 
                        src={selectedCertificateId.instituteLogo} 
                        alt="Institute Logo" 
                        className="photo-preview"
                        style={{ maxWidth: '200px', marginTop: '0px' }} 
                      />
                    )}
                  </div>
                  <div className="field">
                    <label className="label">Certificate ID</label>
                    <input type="text" value={selectedCertificateId.certificateId} className="input" readOnly />
                  </div>
                  
                </div>
                
                {/* Right Column */}
                <div className="field-column">
                  <div className="field">
                    <label className="label">Student Name</label>
                    <input type="text" value={selectedCertificateId.studentName} className="input" readOnly />
                  </div>
                  <div className="field">
                    <label className="label">Course/Degree Name</label>
                    <input type="text" value={selectedCertificateId.courseName} className="input" readOnly />
                  </div>
                  <div className="field">
                    <label className="label">Institute Name</label>
                    <input type="text" value={selectedCertificateId.instituteName} className="input" readOnly />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">
                    Medical Information <Heart className="icon" />
                  </h2>
                </div>
                <div className="field-grid">
                  <div className="field">
                    <label className="label">Grade</label>
                    <input type="text" value={selectedCertificateId.grade} className="input" readOnly />
                  </div>
                  <div className="field">
                    <label className="label">Achievements</label>
                    <textarea value={selectedCertificateId.achievements} className="textarea" readOnly rows={4} />
                  </div>
                  <div className="field">
                    <label className="label">Specialization</label>
                    <textarea value={selectedCertificateId.specialization} className="textarea" readOnly rows={4} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="share-link-container">
            <a 
              href={`${window.location.origin}/certificate/${selectedCertificateId.certificateId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="share-button"
            >
              🔗 Share Certificate
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/certificate/:certificateId" element={<PublicCertificateView />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export function MainApp() {
  const [activeTab, setActiveTab] = useState('form');
  const { wallet } = useAppStore(({ wallet }) => ({ wallet }));

  const tryConnectWallet = () => {
    connectWallet().catch(err => {
      switch (err.message) {
        case 'KEPLR_CONNECTION_ERROR_NO_SMART_WALLET':
          toast.error('No smart wallet at that address', {
            duration: 10000,
            position: 'bottom-right',
          });
          break;
        default:
          toast.error(err.message, {
            duration: 10000,
            position: 'bottom-right',
          });
      }
    });
  };

  const copyAddressToClipboard = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success('Address copied to clipboard!', {
        duration: 3000,
        position: 'bottom-right',
      });
    }
  };

  useEffect(() => {
    setup();
  }, []);

  return (
    <div className="app-container">
      <Toaster />
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="title-section">
            <GraduationCap className="icon" />
            <h1 className="title">Agoric Certificate Management</h1>
          </div>
          <div className="wallet-section">
            <div className="wallet-info">
              {wallet?.address && (
                <div
                  className="wallet-address"
                  onClick={copyAddressToClipboard}
                  style={{ cursor: 'pointer' }}
                  title="Click to copy address"
                >
                  {wallet.address.slice(0, 10)}...{wallet.address.slice(-4)}
                </div>
              )}
              {!wallet?.address && (
                <div className="wallet-address-placeholder" />
              )}
            </div>
            {wallet ? (
              <button onClick={disconnectWallet} className="wallet-button">
                <LogOut className="icon" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button onClick={tryConnectWallet} className="wallet-button">
                <Wallet className="icon" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="content-container">
        <div className="nav-buttons">
          <div
            role="tab"
            className={`nav-tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            <Award className="icon" />
            Register New Certificate
          </div>
          <div
            role="tab"
            className={`nav-tab ${activeTab === 'update' ? 'active' : ''}`}
            onClick={() => setActiveTab('update')}
          >
            <FileText className="icon" />
            Update Certificate Record
          </div>
          <div
            role="tab"
            className={`nav-tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            <Scroll className="icon" />
            View Current Certificates
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'form' ? <EdCertForm /> : 
           activeTab === 'update' ? <UpdateCertificateForm /> : 
           <CertificateTab />}
        </div>
      </div>
    </div>
  );
}

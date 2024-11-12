import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ENDPOINTS } from '../config';
import { Certificate } from '../types';

export const PublicCertificateView: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(
          `${ENDPOINTS.API}/agoric/vstorage/data/published.EdCert.certificates.${certificateId}`,
        );
        const data = await response.json();
        const parsedData = JSON.parse(data.value);
        const cert = JSON.parse(parsedData.values[0]);
        setCertificate(cert);
      } catch (err) {
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!certificate) return <div className="error">Certificate not found</div>;

  return (
    <div className="public-certificate">
      <div className="certificate-container">
        <div className="certificate-header">
          <div className="header-content">
            {certificate.instituteLogo && (
              <img 
                src={certificate.instituteLogo} 
                alt="Institute Logo" 
                className="institute-logo"
              />
            )}
            <h1>{certificate.instituteName}</h1>
          </div>
        </div>

        <div className="certificate-content">
          <h2>Certificate of {certificate.certificateType}</h2>
          
          <p className="certificate-text">
            This is to certify that
          </p>
          
          <h3 className="student-name">{certificate.studentName}</h3>
          
          <p className="certificate-text">
            has successfully completed the course of study in
          </p>
          
          <h3 className="course-name">{certificate.courseName}</h3>
          
          <p className="certificate-text">
            with specialization in {certificate.specialization}
          </p>
          
          <div className="grade-section">
            <p>Grade Achieved: <strong>{certificate.grade}</strong></p>
          </div>

          <div className="date-section">
            <p>From: {new Date(certificate.startDate).toLocaleDateString()} <span style={{display: 'inline-block', width: '200px'}}></span> To: {new Date(certificate.endDate).toLocaleDateString()}</p>
          </div>

          <div className="achievements-section">
            <h4>Achievements</h4>
            <p>{certificate.achievements}</p>
          </div>

          <div className="signature-section">
            {certificate.authoritySignature && (
              <img 
                src={certificate.authoritySignature} 
                alt="Authority Signature" 
                className="signature"
              />
            )}
            <p className="authority-name">{certificate.certifyingAuthority}</p>
            <p className="authority-title">{certificate.authorityDesignation}</p>
          </div>

          <div className="certificate-footer">
            <p className="certificate-id">Certificate ID: {certificate.certificateId}</p>
            <p className="verification-note">
              This certificate can be verified at {window.location.origin}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

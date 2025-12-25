import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, TrendingUp, Activity, Upload, Camera } from 'lucide-react';

// Configuration des services
const SUPABASE_URL = "https://qpwwceigajtigvhpmbpg.supabase.co";
const SUPABASE_KEY = "sb_publishable_hYAcKlZbCfCdW-SzdiEIDA_Ng7jGwO7";

// URL RAILWAY FINALE (Mise à jour selon image_dee2ad.png)
const RAILWAY_API_URL = "https://can-2025-api-production.up.railway.app/predict";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const CAPACITY = {
  'Rabat': 50000,
  'Tanger': 65000,
  'Agadir': 45000,
  'Casablanca': 70000,
  'Marrakech': 40000
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // États pour l'upload Railway
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedStade, setSelectedStade] = useState('Rabat');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Rafraîchissement auto
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Récupération des 100 dernières entrées de Supabase
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/affluence?select=*&order=timestamp.desc&limit=100`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const result = await response.json();
      
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
        setLastUpdate(new Date());
      }
      setLoading(false);
    } catch (error) {
      console.error('Erreur Supabase:', error);
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('stade', selectedStade);

    try {
      const response = await fetch(RAILWAY_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert("Succès ! L'IA Railway a analysé l'image et mis à jour Supabase.");
        setSelectedImage(null);
        fetchData(); // Actualiser les graphiques immédiatement
      } else {
        alert("Le serveur Railway a reçu l'image mais l'analyse a échoué.");
      }
    } catch (error) {
      console.error("Erreur d'upload:", error);
      alert("Impossible de joindre Railway. Vérifiez que le domaine est actif.");
    } finally {
      setUploading(false);
    }
  };

  // Traitement des données pour les graphiques
  const latestByStade = data.reduce((acc, curr) => {
    if (!acc[curr.stade] || new Date(curr.timestamp) > new Date(acc[curr.stade].timestamp)) {
      acc[curr.stade] = curr;
    }
    return acc;
  }, {});

  const stadeStats = Object.values(latestByStade).map(s => ({
    name: s.stade,
    supporters: s.nombre_supporters,
    capacity: CAPACITY[s.stade] || 50000,
    taux: Math.round((s.nombre_supporters / (CAPACITY[s.stade] || 50000)) * 100)
  }));

  const timeSeriesData = data.slice(0, 20).reverse().map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    [d.stade]: d.nombre_supporters
  }));

  const totalSupporters = stadeStats.reduce((sum, s) => sum + s.supporters, 0);
  const avgOccupancy = stadeStats.length > 0 ? Math.round(stadeStats.reduce((sum, s) => sum + s.taux, 0) / stadeStats.length) : 0;
  const criticalStades = stadeStats.filter(s => s.taux > 80).length;

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#166534', color: 'white' }}>
        <h2>Chargement du système CAN 2025 (Railway)...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #166534 0%, #991b1b 50%, #ca8a04 100%)', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0 }}>🏆 CAN 2025 - Monitoring IA</h1>
              <p style={{ opacity: 0.8, margin: '5px 0 0 0' }}>Infrastructure : Vercel + Railway API + Supabase</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <small>Dernière mise à jour</small>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fde047' }}>{lastUpdate.toLocaleTimeString('fr-FR')}</div>
            </div>
          </div>
        </div>

        {/* Section Analyse Image */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '2px dashed rgba(255,255,255,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'white' }}>
            <Camera size={24} />
            <h2 style={{ margin: 0, fontSize: '20px' }}>Envoyer une image au modèle YOLO (Railway)</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select 
              value={selectedStade} 
              onChange={(e) => setSelectedStade(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              {Object.keys(CAPACITY).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setSelectedImage(e.target.files[0])}
              style={{ color: 'white' }}
            />

            <button 
              onClick={handleImageUpload}
              disabled={uploading || !selectedImage}
              style={{ 
                padding: '12px 24px', background: '#22c55e', color: 'white', border: 'none', 
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                opacity: (uploading || !selectedImage) ? 0.6 : 1
              }}
            >
              {uploading ? "Analyse..." : <><Upload size={18} /> Analyser avec YOLOv8</>}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <StatCard title="Total Supporters" value={totalSupporters.toLocaleString()} icon={<Users color="white" />} bg="rgba(59,130,246,0.3)" />
          <StatCard title="Occupation Moy." value={`${avgOccupancy}%`} icon={<TrendingUp color="white" />} bg="rgba(34,197,94,0.3)" />
          <StatCard title="Stades Saturation" value={criticalStades} icon={<AlertTriangle color="white" />} bg="rgba(239,68,68,0.3)" />
          <StatCard title="Services Actifs" value="3/3" icon={<Activity color="white" />} bg="rgba(168,85,247,0.3)" />
        </div>

        {/* Graphiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
          <ChartWrapper title="📊 Taux d'occupation par Stade">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stadeStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="white" />
                <YAxis stroke="white" />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none', color: 'white' }} />
                <Bar dataKey="taux" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>

          <ChartWrapper title="📈 Historique des Détections">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="white" />
                <YAxis stroke="white" />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: 'none' }} />
                <Legend />
                {Object.keys(latestByStade).map((stade, i) => (
                  <Line key={stade} type="monotone" dataKey={stade} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      </div>
    </div>
  );
}

// Composants utilitaires locaux
const StatCard = ({ title, value, icon, bg }) => (
  <div style={{ background: bg, padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ margin: '0 0 5px 0', opacity: 0.7, fontSize: '14px' }}>{title}</p>
        <h3 style={{ margin: 0, fontSize: '24px' }}>{value}</h3>
      </div>
      {icon}
    </div>
  </div>
);

const ChartWrapper = ({ title, children }) => (
  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
    <h3 style={{ color: 'white', marginTop: 0, marginBottom: '20px' }}>{title}</h3>
    {children}
  </div>
);

export default App;

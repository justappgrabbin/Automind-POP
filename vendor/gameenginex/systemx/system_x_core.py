"""
SYSTEM X — Resonance Mechanics Engine
Full implementation: 9-body consciousness fields, network dynamics, collapse detection
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from enum import Enum


class BodyType(Enum):
    """9-body consciousness system"""
    MIND = "mind"
    HEART = "heart"
    BODY = "body"
    SOUL = "soul"
    SPIRIT = "spirit"
    SHADOW = "shadow"
    LIGHT = "light"
    VOID = "void"
    UNITY = "unity"


class WaveLayer(Enum):
    """3-layer wave mechanics"""
    ACTION = "action"
    THOUGHT = "thought"
    FEELING = "feeling"


@dataclass
class ResonanceField:
    """
    Single consciousness body field state
    
    E = m · c · k^β
    """
    
    body_type: BodyType
    m: float = 1.0
    c: float = 1.0
    k: float = 1.0
    beta: float = 1.0
    phase: float = 0.0
    
    action_amp: float = 1.0
    thought_amp: float = 1.0
    feeling_amp: float = 1.0
    
    bivector: np.ndarray = field(default_factory=lambda: np.zeros(6))
    chart_data: Dict = field(default_factory=dict)
    gate_activations: List[int] = field(default_factory=list)
    
    def energy(self) -> float:
        """Total resonance energy: E = m · c · k^β"""
        return self.m * self.c * (self.k ** self.beta)
    
    def wave_amplitude(self, layer: WaveLayer, t: float) -> float:
        """Wave function for specific layer at time t"""
        layer_phase = {
            WaveLayer.ACTION: 0,
            WaveLayer.THOUGHT: 2 * np.pi / 3,
            WaveLayer.FEELING: 4 * np.pi / 3
        }[layer]
        
        layer_amp = {
            WaveLayer.ACTION: self.action_amp,
            WaveLayer.THOUGHT: self.thought_amp,
            WaveLayer.FEELING: self.feeling_amp
        }[layer]
        
        return layer_amp * np.sin(t + self.phase + layer_phase)
    
    def update_coherence(self, internal: float = 0.01, external: float = 0.0):
        """Coherence dynamics: self-regulation + external influence"""
        self.k = np.clip(self.k + internal + external, 0.001, 5.0)
    
    def apply_phase_correction(self, target_phase: float, strength: float = 0.1):
        """Phase alignment toward target"""
        delta = np.sin(target_phase - self.phase)
        self.phase += strength * delta
        self.phase = self.phase % (2 * np.pi)
    
    def is_collapsing(self, threshold: float = 0.3) -> bool:
        """Detect field collapse"""
        return self.k < threshold
    
    def update_bivector(self):
        """Update Clifford algebra bivector from field state"""
        self.bivector[0] = self.m * np.cos(self.phase)
        self.bivector[1] = self.m * np.sin(self.phase)
        self.bivector[2] = self.c * np.cos(self.phase + np.pi/4)
        self.bivector[3] = self.c * np.sin(self.phase + np.pi/4)
        self.bivector[4] = self.k * np.cos(self.beta)
        self.bivector[5] = self.k * np.sin(self.beta)
    
    def to_dict(self) -> Dict:
        """Serialize to dictionary"""
        return {
            'body_type': self.body_type.value,
            'm': float(self.m),
            'c': float(self.c),
            'k': float(self.k),
            'beta': float(self.beta),
            'phase': float(self.phase),
            'energy': float(self.energy()),
            'wave_amplitudes': {
                'action': float(self.action_amp),
                'thought': float(self.thought_amp),
                'feeling': float(self.feeling_amp)
            },
            'is_collapsing': self.is_collapsing()
        }


class CliffordEngine:
    """Geometric product calculations for field coupling"""
    
    @staticmethod
    def geometric_product(b1: np.ndarray, b2: np.ndarray) -> Tuple[float, np.ndarray, float]:
        """Geometric product of two bivectors"""
        scalar = -np.dot(b1, b2)
        
        bivector = np.array([
            b1[4] * b2[5] - b1[5] * b2[4],
            b1[5] * b2[3] - b1[3] * b2[5],
            b1[3] * b2[4] - b1[4] * b2[3],
            b1[2] * b2[5] - b1[5] * b2[2],
            b1[0] * b2[3] - b1[3] * b2[0],
            b1[1] * b2[4] - b1[4] * b2[1]
        ])
        
        pseudoscalar = np.sum(b1 * np.roll(b2, 3))
        
        return scalar, bivector, pseudoscalar
    
    @staticmethod
    def field_resonance(f1: ResonanceField, f2: ResonanceField) -> float:
        """Calculate resonance between two fields using geometric product"""
        scalar, _, _ = CliffordEngine.geometric_product(f1.bivector, f2.bivector)
        return abs(scalar)


@dataclass
class CouplingResult:
    """Result of field coupling interaction"""
    harmonic_coupling: float
    phase_alignment: float
    energy_transfer: float
    resonance_scalar: float
    collapse_risk_a: bool
    collapse_risk_b: bool


class ResonanceEngine:
    """Core resonance mechanics"""
    
    def __init__(self, collapse_threshold: float = 0.3, coupling_strength: float = 0.01):
        self.collapse_threshold = collapse_threshold
        self.coupling_strength = coupling_strength
        self.clifford = CliffordEngine()
    
    def harmonic_coupling(self, A: ResonanceField, B: ResonanceField) -> float:
        """Harmonic interaction strength: H = mA·mB · kA·kB · cos(Δφ)"""
        phase_diff = A.phase - B.phase
        H = (A.m * B.m) * (A.k * B.k) * np.cos(phase_diff)
        return H
    
    def energy_redistribution(self, A: ResonanceField, B: ResonanceField, coupling: float):
        """Energy flow between fields"""
        transfer = self.coupling_strength * coupling
        A.m = np.clip(A.m + transfer, 0.1, 5.0)
        B.m = np.clip(B.m - transfer, 0.1, 5.0)
        return transfer
    
    def step(self, A: ResonanceField, B: ResonanceField, dt: float = 1.0) -> CouplingResult:
        """Single timestep of resonance mechanics between two fields"""
        A.update_bivector()
        B.update_bivector()
        
        H = self.harmonic_coupling(A, B)
        resonance = self.clifford.field_resonance(A, B)
        
        phase_diff = abs(A.phase - B.phase)
        A.apply_phase_correction(B.phase, strength=0.1 * dt)
        B.apply_phase_correction(A.phase, strength=0.1 * dt)
        
        transfer = self.energy_redistribution(A, B, H)
        
        A.update_coherence(internal=0.01 * dt, external=0.001 * H * dt)
        B.update_coherence(internal=0.01 * dt, external=0.001 * H * dt)
        
        collapse_a = A.is_collapsing(self.collapse_threshold)
        collapse_b = B.is_collapsing(self.collapse_threshold)
        
        return CouplingResult(
            harmonic_coupling=H,
            phase_alignment=phase_diff,
            energy_transfer=transfer,
            resonance_scalar=resonance,
            collapse_risk_a=collapse_a,
            collapse_risk_b=collapse_b
        )


@dataclass
class User:
    """User with 9-body consciousness field"""
    user_id: str
    fields: Dict[BodyType, ResonanceField]
    
    def total_energy(self) -> float:
        """Sum of all body energies"""
        return sum(f.energy() for f in self.fields.values())
    
    def coherence_index(self) -> float:
        """Average coherence across all bodies"""
        return np.mean([f.k for f in self.fields.values()])
    
    def phase_variance(self) -> float:
        """Phase synchronization metric"""
        phases = [f.phase for f in self.fields.values()]
        return np.var(phases)
    
    def to_dict(self) -> Dict:
        """Serialize to dictionary"""
        return {
            'user_id': self.user_id,
            'total_energy': float(self.total_energy()),
            'coherence_index': float(self.coherence_index()),
            'phase_variance': float(self.phase_variance()),
            'fields': {body_type.value: field.to_dict() 
                      for body_type, field in self.fields.items()}
        }


class SynthAI:
    """Multi-user network resonance system"""
    
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.engine = ResonanceEngine()
        self.interaction_history: List[Dict] = []
        
    def add_user(self, user_id: str, chart_data: Optional[Dict] = None):
        """Initialize user with 9-body field structure"""
        fields = {}
        for body_type in BodyType:
            field = ResonanceField(
                body_type=body_type,
                m=np.random.uniform(0.8, 1.2),
                c=np.random.uniform(0.8, 1.2),
                k=np.random.uniform(0.6, 1.0),
                beta=np.random.uniform(0.9, 1.1),
                phase=np.random.uniform(0, 2 * np.pi)
            )
            if chart_data:
                field.chart_data = chart_data
            fields[body_type] = field
        
        self.users[user_id] = User(user_id=user_id, fields=fields)
    
    def get_user_state(self, user_id: str) -> Optional[Dict]:
        """Get user's full consciousness field state"""
        if user_id not in self.users:
            return None
        return self.users[user_id].to_dict()
    
    def network_step(self, dt: float = 1.0):
        """Update entire network for one timestep"""
        results = []
        user_ids = list(self.users.keys())
        
        for i, uid_a in enumerate(user_ids):
            for uid_b in user_ids[i+1:]:
                for body_type in BodyType:
                    user_a = self.users[uid_a]
                    user_b = self.users[uid_b]
                    result = self.engine.step(user_a.fields[body_type], 
                                            user_b.fields[body_type])
                    results.append({
                        'user_a': uid_a,
                        'user_b': uid_b,
                        'body': body_type.value,
                        'coupling': result.harmonic_coupling,
                        'resonance': result.resonance_scalar
                    })
        
        return results
    
    def get_network_coherence(self) -> float:
        """Global network coherence metric"""
        if not self.users:
            return 0.0
        return np.mean([user.coherence_index() for user in self.users.values()])

<template>
  <section>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px">
      <div style="display:flex;gap:8px">
        <button class="btn-primary" @click="fit">Ajustar</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input v-model="search" @input="onSearch" placeholder="Buscar persona..." style="padding:10px;border-radius:8px;border:1px solid var(--color-border);min-width:260px" />
        <button v-if="!isDemo" class="btn-primary" @click="openQuickRoot">Agregar persona</button>
      </div>
    </div>

    <div ref="canvas" class="canvas" tabindex="0" @wheel="onWheel" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove" @click="focusCanvas">
      <div class="content" :style="contentStyle">
        <svg :width="contentWidth" :height="contentHeight" class="edges">
          <defs>
            <!-- Gradientes para diferentes tipos de conexiones -->
            <linearGradient id="partnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
              <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.8" />
            </linearGradient>
            
            <linearGradient id="familyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#64748b;stop-opacity:0.7" />
              <stop offset="50%" style="stop-color:#475569;stop-opacity:0.5" />
              <stop offset="100%" style="stop-color:#64748b;stop-opacity:0.7" />
            </linearGradient>
          </defs>
          
          <g>
            <!-- Líneas de pareja -->
            <path v-for="edge in partnerEdges" 
                  :d="renderSvgPath(edge)"
                  class="edge partner" />

            <!-- Líneas verticales principales (desde padres hacia abajo) -->
            <path v-for="edge in spineEdges" 
                  :d="renderSvgPath(edge)"
                  class="edge spine" />

            <!-- Líneas horizontales de conexión (punto medio a hijos) -->
            <path v-for="edge in branchEdges" 
                  :d="renderSvgPath(edge)"
                  class="edge branch" />
          </g>
        </svg>
        
        <div v-for="node in nodesDisplayed" :key="node.id" class="node" :class="sexClass(node.sex)" :style="nodeStyle(node.id)" @click.stop="select(node)">
          <div class="avatar-text">{{ getFullName(node) }}</div>
          <div class="name">{{ node.displayName }}</div>
          <div class="years">{{ formatYears(node.birthYear, node.deathYear) }}</div>
          <div v-if="!isDemo" class="actions">
            <button title="Agregar" @click.stop="openQuick(node)">+</button>
            <button title="Eliminar" @click.stop="confirmDelete(node)" class="delete-btn">×</button>
          </div>
        </div>
      </div>
    </div>

    <aside v-if="selected" class="side">
      <header class="side-header">
        <div class="person-avatar">{{ getInitials(selected) }}</div>
        <div class="person-info">
          <h2 class="person-name">{{ selected.displayName || 'Sin nombre' }}</h2>
          <p class="person-years">{{ formatYears(selected.birthYear, selected.deathYear) }}</p>
        </div>
        <button class="side-close-btn" @click="selected=null">×</button>
      </header>
      
      <div class="side-content">
        <div class="info-section">
          <h3>Información Personal</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Sexo:</span>
              <span class="info-value">{{ getSexLabel(selected.sex) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nacimiento:</span>
              <span class="info-value">{{ selected.birthYear || 'Desconocido' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fallecimiento:</span>
              <span class="info-value">{{ selected.deathYear || 'Hoy' }}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>Relaciones Familiares</h3>
          <div class="relationships">
            <div v-if="getParents(selected).length > 0" class="relationship-group">
              <h4>Padres</h4>
              <div class="relationship-list">
                <div v-for="parent in getParents(selected)" :key="parent.id" class="relationship-item" @click="select(parent)">
                  <div class="relationship-avatar">{{ getInitials(parent) }}</div>
                  <span class="relationship-name">{{ parent.displayName }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="getChildren(selected).length > 0" class="relationship-group">
              <h4>Hijos</h4>
              <div class="relationship-list">
                <div v-for="child in getChildren(selected)" :key="child.id" class="relationship-item" @click="select(child)">
                  <div class="relationship-avatar">{{ getInitials(child) }}</div>
                  <span class="relationship-name">{{ child.displayName }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="getPartners(selected).length > 0" class="relationship-group">
              <h4>Parejas</h4>
              <div class="relationship-list">
                <div v-for="partner in getPartners(selected)" :key="partner.id" class="relationship-item" @click="select(partner)">
                  <div class="relationship-avatar">{{ getInitials(partner) }}</div>
                  <span class="relationship-name">{{ partner.displayName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <ul v-if="suggestions.length" class="suggestions">
      <li v-for="s in suggestions" :key="s._id" @click="centerOn(s)">{{ s.displayName }}</li>
    </ul>

    <QuickAddModal v-if="!isDemo" :open="openQuickModal" :context="quickContext" @close="openQuickModal=false" @created="onCreated" />
    
    <!-- Modal de confirmación para eliminar -->
    <div v-if="deleteConfirmModal" class="modal-overlay" @click="deleteConfirmModal=false">
      <div class="modal" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que quieres eliminar a <strong>{{ nodeToDelete?.displayName }}</strong>?</p>
        <p class="warning">Esta acción no se puede deshacer y eliminará todas las relaciones asociadas.</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="deleteConfirmModal=false">Cancelar</button>
          <button class="btn-danger" @click="deletePerson">Eliminar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../api';
import QuickAddModal from '../components/QuickAddModal.vue';

const route = useRoute();
const treeId = route.params.id as string;

// Verificar si es el demo
const isDemo = computed(() => treeId === 'demo');

const nodes = ref<any[]>([]);
const selected = ref<any|null>(null);
const tab = ref<'resumen'|'relaciones'|'medios'|'notas'>('resumen');

const canvas = ref<HTMLElement|null>(null);
const scale = ref(0.9);
const pan = ref({ x: 0, y: 0 });
const dragging = ref(false);
const last = ref({ x: 0, y: 0 });


const NODE_W = 220; const NODE_H = 120; const GAP_X = 60; const GAP_Y = 140; const COUPLE_GAP = 12;

// Funciones helper para calcular centros y bordes
function centerX(pos: { x: number, y: number }) { return pos.x + NODE_W / 2; }
function centerY(pos: { x: number, y: number }) { return pos.y + NODE_H / 2; }
function bottomY(pos: { x: number, y: number }) { return pos.y + NODE_H; }

const positions = ref(new Map<string, { x: number, y: number }>());
const contentWidth = ref(2000);
const contentHeight = ref(1200);

const contentStyle = computed(() => ({ transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${scale.value})` }));

// Variables para las líneas de conexión
const partnerEdges = ref<any[]>([]);
const spineEdges = ref<any[]>([]);
const branchEdges = ref<any[]>([]);

// Función para renderizar paths SVG
function renderSvgPath(edge: any): string {
  if (!edge) return '';
  
  const { x1, y1, x2, y2 } = edge;
  
  // Validar coordenadas
  if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
    console.warn('Coordenadas inválidas en línea:', edge);
    return '';
  }
  
  return `M ${x1},${y1} L ${x2},${y2}`;
}

const hiddenNodes = ref(new Set<string>());
const nodesDisplayed = computed(() => nodes.value.filter(n => !hiddenNodes.value.has(n.id)));


function sexClass(sex: string) {
  if (sex === 'M') return 'male';
  if (sex === 'F') return 'female';
  return 'unknown';
}

function nodeStyle(id: string) {
  const p = positions.value.get(id) || { x: 0, y: 0 };
  return { left: p.x + 'px', top: p.y + 'px', width: NODE_W + 'px', height: NODE_H + 'px' } as any;
}

function formatYears(b?: string|null, d?: string|null) {
  const by = b ? (b.match(/\d{4}/)?.[0] || '') : '';
  const dy = d ? (d.match(/\d{4}/)?.[0] || '') : '';
  return `${by || '—'}–${dy || 'Hoy'}`;
}

function getFullName(node: any) {
  // Si tiene givenNames y familyNames, usar el primer nombre y primer apellido
  if (node.givenNames && node.givenNames.length > 0 && node.familyNames && node.familyNames.length > 0) {
    const firstName = node.givenNames[0];
    const lastName = node.familyNames[0];
    return `${firstName} ${lastName}`;
  }
  
  // Si tiene displayName, extraer el primer nombre y primer apellido
  if (node.displayName && node.displayName.trim()) {
    const names = node.displayName.trim().split(' ');
    if (names.length >= 2) {
      // Buscar el primer apellido (asumiendo que los nombres van primero, luego apellidos)
      // Si hay 2 nombres y 2 apellidos: [nombre1, nombre2, apellido1, apellido2]
      // Queremos: nombre1 apellido1
      const firstName = names[0];
      // Si hay 4 o más partes, el primer apellido está en la posición 2 (índice 2)
      // Si hay 3 partes, el primer apellido está en la posición 1 (índice 1)
      // Si hay 2 partes, el primer apellido está en la posición 1 (índice 1)
      let firstLastName;
      if (names.length >= 4) {
        firstLastName = names[2]; // nombre1 nombre2 apellido1 apellido2
      } else if (names.length === 3) {
        firstLastName = names[1]; // nombre1 apellido1 apellido2
      } else {
        firstLastName = names[1]; // nombre1 apellido1
      }
      return `${firstName} ${firstLastName}`;
    } else if (names.length === 1) {
      return names[0];
    }
  }
  
  // Si solo tiene givenNames
  if (node.givenNames && node.givenNames.length > 0) {
    return node.givenNames[0];
  }
  
  // Si solo tiene familyNames
  if (node.familyNames && node.familyNames.length > 0) {
    return node.familyNames[0];
  }
  
  // Fallback: usar el ID
  if (node.id) {
    return `Persona ${node.id}`;
  }
  
  return 'Sin nombre';
}

function getInitials(node: any) {
  // Si tiene givenNames y familyNames, usar las iniciales del primer nombre y primer apellido
  if (node.givenNames && node.givenNames.length > 0 && node.familyNames && node.familyNames.length > 0) {
    const firstName = node.givenNames[0];
    const lastName = node.familyNames[0];
    return (firstName[0] + lastName[0]).toUpperCase();
  }
  
  // Si tiene displayName, extraer las iniciales del primer nombre y primer apellido
  if (node.displayName && node.displayName.trim()) {
    const names = node.displayName.trim().split(' ');
    if (names.length >= 2) {
      // Buscar el primer apellido (misma lógica que en getFullName)
      const firstName = names[0];
      let firstLastName;
      if (names.length >= 4) {
        firstLastName = names[2]; // nombre1 nombre2 apellido1 apellido2
      } else if (names.length === 3) {
        firstLastName = names[1]; // nombre1 apellido1 apellido2
      } else {
        firstLastName = names[1]; // nombre1 apellido1
      }
      return (firstName[0] + firstLastName[0]).toUpperCase();
    } else if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
  }
  
  // Si solo tiene givenNames
  if (node.givenNames && node.givenNames.length > 0) {
    return node.givenNames[0][0].toUpperCase();
  }
  
  // Si solo tiene familyNames
  if (node.familyNames && node.familyNames.length > 0) {
    return node.familyNames[0][0].toUpperCase();
  }
  
  // Fallback: usar las primeras letras del ID
  if (node.id) {
    return node.id.substring(0, 2).toUpperCase();
  }
  
  return '?';
}

function getSexLabel(sex: string) {
  switch (sex) {
    case 'M': return 'Masculino';
    case 'F': return 'Femenino';
    default: return 'No especificado';
  }
}

function getParents(person: any) {
  const parents = [];
  
  // Agregar padre biológico
  if (person.fatherId) {
    const father = nodes.value.find(n => n.id === person.fatherId);
    if (father) {
      parents.push(father);
      
      // Si el padre tiene pareja, también agregar a la pareja como co-padre
      if (father.partners && Array.isArray(father.partners)) {
        for (const partnerId of father.partners) {
          const partner = nodes.value.find(n => n.id === partnerId);
          if (partner && !parents.find(p => p.id === partnerId)) {
            parents.push(partner);
          }
        }
      }
    }
  }
  
  // Agregar madre biológica
  if (person.motherId) {
    const mother = nodes.value.find(n => n.id === person.motherId);
    if (mother) {
      parents.push(mother);
      
      // Si la madre tiene pareja, también agregar a la pareja como co-padre
      if (mother.partners && Array.isArray(mother.partners)) {
        for (const partnerId of mother.partners) {
          const partner = nodes.value.find(n => n.id === partnerId);
          if (partner && !parents.find(p => p.id === partnerId)) {
            parents.push(partner);
          }
        }
      }
    }
  }
  
  // Ordenar por edad (mayor primero)
  return parents.sort((a, b) => {
    const yearA = a.birthYear ? parseInt(a.birthYear.match(/\d{4}/)?.[0] || '0') : 0;
    const yearB = b.birthYear ? parseInt(b.birthYear.match(/\d{4}/)?.[0] || '0') : 0;
    return yearB - yearA; // Orden descendente (mayor primero)
  });
}

function getChildren(person: any) {
  const children = nodes.value.filter(n => n.fatherId === person.id || n.motherId === person.id);
  
  // Si la persona tiene pareja, también incluir los hijos de la pareja
  if (person.partners && Array.isArray(person.partners)) {
    for (const partnerId of person.partners) {
      const partnerChildren = nodes.value.filter(n => n.fatherId === partnerId || n.motherId === partnerId);
      children.push(...partnerChildren);
    }
  }
  
  // Eliminar duplicados (en caso de que un hijo tenga ambos padres como pareja)
  const uniqueChildren = children.filter((child, index, self) => 
    index === self.findIndex(c => c.id === child.id)
  );
  
  // Ordenar por edad (mayor primero)
  return uniqueChildren.sort((a, b) => {
    const yearA = a.birthYear ? parseInt(a.birthYear.match(/\d{4}/)?.[0] || '0') : 0;
    const yearB = b.birthYear ? parseInt(b.birthYear.match(/\d{4}/)?.[0] || '0') : 0;
    return yearB - yearA; // Orden descendente (mayor primero)
  });
}

function getPartners(person: any) {
  const partners = [];
  if (person.partners && Array.isArray(person.partners)) {
    for (const partnerId of person.partners) {
      const partner = nodes.value.find(n => n.id === partnerId);
      if (partner) partners.push(partner);
    }
  }
  
  // Ordenar por edad (mayor primero)
  return partners.sort((a, b) => {
    const yearA = a.birthYear ? parseInt(a.birthYear.match(/\d{4}/)?.[0] || '0') : 0;
    const yearB = b.birthYear ? parseInt(b.birthYear.match(/\d{4}/)?.[0] || '0') : 0;
    return yearB - yearA; // Orden descendente (mayor primero)
  });
}

function select(n: any) { selected.value = n; tab.value = 'resumen'; }

function onWheel(e: WheelEvent) { 
  e.preventDefault();
  e.stopPropagation();
  
  const zoomFactor = 0.1;
  const delta = e.deltaY > 0 ? -zoomFactor : zoomFactor;
  const newScale = Math.max(0.2, Math.min(2.0, scale.value + delta));
  
  console.log('Zoom:', newScale); // Debug
  scale.value = newScale;
}
function onMouseDown(e: MouseEvent) { dragging.value = true; last.value = { x: e.clientX, y: e.clientY }; }
function onMouseUp() { dragging.value = false; }
function onMouseMove(e: MouseEvent) {
  if (!dragging.value) return;
  const dx = e.clientX - last.value.x; const dy = e.clientY - last.value.y;
  pan.value = { x: pan.value.x + dx, y: pan.value.y + dy };
  last.value = { x: e.clientX, y: e.clientY };
}
function fit() { 
  fitToContent(); 
}

function focusCanvas() {
  if (canvas.value) {
    canvas.value.focus();
  }
}

function fitToContent() {
  if (!canvas.value) return;
  const canvasWidth = canvas.value.clientWidth;
  const canvasHeight = canvas.value.clientHeight;
  
  // Calcular el zoom para que el contenido se ajuste al canvas con un margen
  const margin = 50; // Margen en píxeles
  const availableWidth = canvasWidth - (margin * 2);
  const availableHeight = canvasHeight - (margin * 2);
  
  const scaleX = availableWidth / contentWidth.value;
  const scaleY = availableHeight / contentHeight.value;
  
  // Usar el menor de los dos escalas para asegurar que todo el contenido sea visible
  const newScale = Math.min(scaleX, scaleY, 1.5); // Máximo 100% de zoom
  
  scale.value = Math.max(0.1, newScale); // Mínimo 10% de zoom
  
  // Calcular dimensiones escaladas
  const scaledWidth = contentWidth.value * scale.value;
  const scaledHeight = contentHeight.value * scale.value;
  
  // Centrar el contenido en el canvas
  pan.value = { 
    x: (canvasWidth - scaledWidth) / 2, 
    y: (canvasHeight - scaledHeight) / 2 
  };
  
  console.log('Ajuste automático:', {
    canvasWidth,
    canvasHeight,
    contentWidth: contentWidth.value,
    contentHeight: contentHeight.value,
    availableWidth,
    availableHeight,
    scaleX,
    scaleY,
    newScale,
    finalScale: scale.value,
    scaledWidth,
    scaledHeight,
    pan: pan.value
  });
}


const search = ref('');
const suggestions = ref<any[]>([]);
let searchTimer: any = null;
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (!search.value) { suggestions.value = []; return; }
    // Para el demo, no implementamos búsqueda por ahora
    if (isDemo.value) { suggestions.value = []; return; }
    const res = await api.get(`/trees/${treeId}/search`, { params: { q: search.value } });
    suggestions.value = res.data || [];
  }, 200);
}

async function fetchNodes() {
  try {
    let res;
    if (isDemo.value) {
      // Usar la ruta especial del demo
      res = await api.get('/trees/demo/people');
    } else {
      // Usar la ruta normal con autenticación
      res = await api.get(`/trees/${treeId}/people`);
    }
    nodes.value = res.data;
    computeHidden();
    computeLayout();
    
    // Esperar un frame para que el DOM se actualice antes de centrar
    await new Promise(resolve => requestAnimationFrame(resolve));
    fitToContent();
  } catch (error) {
    console.error('Error cargando nodos:', error);
    nodes.value = [];
  }
}

function centerOn(s: any) {
  const n = nodes.value.find(x => x.id === s._id || x.id === s.id);
  if (n) select(n);
  suggestions.value = [];
  search.value = '';
}


function computeHidden() {
  // Sin funcionalidad de colapso, todos los nodos están visibles
  hiddenNodes.value = new Set<string>();
}


// Helpers
function childSorter(children: string[]): string[] {
  return children; // Mantener orden original
}

// Reemplazar las funciones problemáticas con esta versión corregida:

// Función mejorada para calcular posiciones de parejas
function getPartnerPositions(partner1Id: string, partner2Id: string, centerX: number, y: number) {
  const partner1 = nodes.value.find(n => n.id === partner1Id);
  const partner2 = nodes.value.find(n => n.id === partner2Id);
  
  // Determinar posiciones basadas en el sexo (hombre a la izquierda, mujer a la derecha)
  let leftPartner, rightPartner;
  
  if (partner1?.sex === 'M' && partner2?.sex === 'F') {
    leftPartner = partner1Id;
    rightPartner = partner2Id;
  } else if (partner1?.sex === 'F' && partner2?.sex === 'M') {
    leftPartner = partner2Id;
    rightPartner = partner1Id;
  } else {
    // Por defecto: orden alfabético o por ID
    leftPartner = partner1Id < partner2Id ? partner1Id : partner2Id;
    rightPartner = partner1Id < partner2Id ? partner2Id : partner1Id;
  }
  
  const totalWidth = NODE_W * 2 + COUPLE_GAP;
  const leftX = centerX - totalWidth / 2;
  const rightX = leftX + NODE_W + COUPLE_GAP;
  
  return {
    partner1Pos: { x: leftX, y },
    partner2Pos: { x: rightX, y },
    leftPartner,
    rightPartner
  };
}




// Tipo para bloques familiares
type FamilyBlock = { 
  key: string; 
  partner1: string; 
  partner2: string | null; 
  children: string[];
  parents: string[];
  isRoot: boolean;
  depth: number;
};

// Función para detectar colisiones entre nodos
function detectCollisions(positions: Map<string, { x: number, y: number }>): Array<{node1: string, node2: string, overlap: number}> {
  const collisions: Array<{node1: string, node2: string, overlap: number}> = [];
  const nodeIds = Array.from(positions.keys());
  
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const node1 = nodeIds[i];
      const node2 = nodeIds[j];
      const pos1 = positions.get(node1)!;
      const pos2 = positions.get(node2)!;
      
      // Calcular si hay superposición
      const overlapX = Math.max(0, Math.min(pos1.x + NODE_W, pos2.x + NODE_W) - Math.max(pos1.x, pos2.x));
      const overlapY = Math.max(0, Math.min(pos1.y + NODE_H, pos2.y + NODE_H) - Math.max(pos1.y, pos2.y));
      
      if (overlapX > 0 && overlapY > 0) {
        const overlap = overlapX * overlapY;
        collisions.push({ node1, node2, overlap });
      }
    }
  }
  
  return collisions.sort((a, b) => b.overlap - a.overlap); // Ordenar por mayor superposición
}

// Función para corregir colisiones (preservando parejas)
function resolveCollisions(positions: Map<string, { x: number, y: number }>): void {
  const maxIterations = 10;
  let iterations = 0;
  
  // Crear un mapa de parejas para preservarlas
  const partnerPairs = new Set<string>();
  for (const node of nodes.value) {
    if (node.partners && Array.isArray(node.partners)) {
      for (const partnerId of node.partners) {
        const pairKey = [node.id, String(partnerId)].sort().join('|');
        partnerPairs.add(pairKey);
      }
    }
  }
  
  while (iterations < maxIterations) {
    const collisions = detectCollisions(positions);
    
    if (collisions.length === 0) {
      break; // No hay más colisiones
    }
    
    // Resolver la colisión más grande
    const collision = collisions[0];
    const pos1 = positions.get(collision.node1)!;
    const pos2 = positions.get(collision.node2)!;
    
    // Verificar si alguno de los nodos es parte de una pareja
    const pairKey1 = Array.from(partnerPairs).find(pair => pair.includes(collision.node1));
    const pairKey2 = Array.from(partnerPairs).find(pair => pair.includes(collision.node2));
    
    // Calcular dirección de separación
    const center1 = { x: pos1.x + NODE_W / 2, y: pos1.y + NODE_H / 2 };
    const center2 = { x: pos2.x + NODE_W / 2, y: pos2.y + NODE_H / 2 };
    
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      // Calcular cuánto se necesita mover
      const minDistance = NODE_W + GAP_X;
      const moveDistance = (minDistance - distance) / 2 + 5; // +5 para un poco de margen
      
      const moveX = (dx / distance) * moveDistance;
      const moveY = (dy / distance) * moveDistance;
      
      // Si ambos nodos son parte de parejas, mover ambos bloques de pareja juntos
      if (pairKey1 && pairKey2) {
        const [partner1a, partner1b] = pairKey1.split('|');
        const [partner2a, partner2b] = pairKey2.split('|');
        
        // Mover el primer bloque de pareja
        const pos1a = positions.get(partner1a)!;
        const pos1b = positions.get(partner1b)!;
        positions.set(partner1a, { x: pos1a.x - moveX, y: pos1a.y - moveY });
        positions.set(partner1b, { x: pos1b.x - moveX, y: pos1b.y - moveY });
        
        // Mover el segundo bloque de pareja
        const pos2a = positions.get(partner2a)!;
        const pos2b = positions.get(partner2b)!;
        positions.set(partner2a, { x: pos2a.x + moveX, y: pos2a.y + moveY });
        positions.set(partner2b, { x: pos2b.x + moveX, y: pos2b.y + moveY });
      } else if (pairKey1) {
        // Solo el primer nodo es parte de una pareja
        const [partner1a, partner1b] = pairKey1.split('|');
        
        // Mover el bloque de pareja
        const pos1a = positions.get(partner1a)!;
        const pos1b = positions.get(partner1b)!;
        positions.set(partner1a, { x: pos1a.x - moveX, y: pos1a.y - moveY });
        positions.set(partner1b, { x: pos1b.x - moveX, y: pos1b.y - moveY });
        
        // Mover el nodo individual
        positions.set(collision.node2, {
          x: pos2.x + moveX,
          y: pos2.y + moveY
        });
      } else if (pairKey2) {
        // Solo el segundo nodo es parte de una pareja
        const [partner2a, partner2b] = pairKey2.split('|');
        
        // Mover el nodo individual
        positions.set(collision.node1, {
          x: pos1.x - moveX,
          y: pos1.y - moveY
        });
        
        // Mover el bloque de pareja
        const pos2a = positions.get(partner2a)!;
        const pos2b = positions.get(partner2b)!;
        positions.set(partner2a, { x: pos2a.x + moveX, y: pos2a.y + moveY });
        positions.set(partner2b, { x: pos2b.x + moveX, y: pos2b.y + moveY });
      } else {
        // Ambos nodos son individuales
        positions.set(collision.node1, {
          x: pos1.x - moveX,
          y: pos1.y - moveY
        });
        
        positions.set(collision.node2, {
          x: pos2.x + moveX,
          y: pos2.y + moveY
        });
      }
    }
    
    iterations++;
  }
}

// Layout mejorado con sistema de bloques familiares
function computeLayout() {
  positions.value = new Map();
  
  // Inicializar arrays de líneas de conexión
  partnerEdges.value = []; 
  spineEdges.value = []; 
  branchEdges.value = [];

  const byId = new Map<string, any>();
  nodes.value.forEach(n => byId.set(n.id, n));

  // 1. Construir bloques de pareja con relaciones explícitas
  type FamilyBlock = { 
    key: string; 
    partner1: string; 
    partner2: string | null; 
    children: string[];
    parents: string[]; // NUEVO: padres del bloque
    isRoot: boolean;
    depth: number; // NUEVO: profundidad calculada
  };
  
  const blocks = new Map<string, FamilyBlock>();
  const personToBlocks = new Map<string, string[]>(); // NUEVO: una persona puede estar en múltiples bloques

  // Construir bloques de pareja
  for (const n of nodes.value) {
    const partners: any[] = Array.isArray(n.partners) ? n.partners : [];
    
    // Si tiene pareja, crear bloque de pareja
    if (partners.length > 0) {
      for (const partnerId of partners) {
        const partner = byId.get(String(partnerId));
        if (partner) {
          const blockKey = [String(n.id), String(partnerId)].sort().join('|');
          if (!blocks.has(blockKey)) {
            blocks.set(blockKey, {
              key: blockKey,
              partner1: String(n.id),
              partner2: String(partnerId),
              children: [],
              parents: [], // NUEVO
              isRoot: false,
              depth: 0
            });
            
            // NUEVO: agregar a múltiples bloques
            if (!personToBlocks.has(String(n.id))) personToBlocks.set(String(n.id), []);
            if (!personToBlocks.has(String(partnerId))) personToBlocks.set(String(partnerId), []);
            personToBlocks.get(String(n.id))!.push(blockKey);
            personToBlocks.get(String(partnerId))!.push(blockKey);
          }
        }
      }
    } else {
      // Persona sin pareja - crear bloque individual
      const blockKey = String(n.id);
      if (!blocks.has(blockKey)) {
        blocks.set(blockKey, {
          key: blockKey,
          partner1: String(n.id),
          partner2: null,
          children: [],
          parents: [], // NUEVO
          isRoot: false,
          depth: 0
        });
        
        // NUEVO: agregar a múltiples bloques
        if (!personToBlocks.has(String(n.id))) personToBlocks.set(String(n.id), []);
        personToBlocks.get(String(n.id))!.push(blockKey);
      }
    }
  }

  // NUEVO: Construir relaciones padre-hijo bidireccionales
  for (const n of nodes.value) {
    if (n.fatherId || n.motherId) {
      const childId = String(n.id);
      const fatherId = String(n.fatherId);
      const motherId = String(n.motherId);
      
      // Encontrar bloques de los padres
      const fatherBlocks = personToBlocks.get(fatherId) || [];
      const motherBlocks = personToBlocks.get(motherId) || [];
      
      // Agregar como hijo a los bloques de los padres
      fatherBlocks.forEach(blockKey => {
        const block = blocks.get(blockKey);
        if (block && !block.children.includes(childId)) {
          block.children.push(childId);
        }
      });
      
      motherBlocks.forEach(blockKey => {
        const block = blocks.get(blockKey);
        if (block && !block.children.includes(childId)) {
          block.children.push(childId);
        }
      });
      
      // NUEVO: Agregar padres a los bloques del hijo
      const childBlocks = personToBlocks.get(childId) || [];
      childBlocks.forEach(blockKey => {
        const block = blocks.get(blockKey);
        if (block) {
          // Agregar padre si no está ya
          if (fatherId && !block.parents.includes(fatherId)) {
            block.parents.push(fatherId);
          }
          if (motherId && !block.parents.includes(motherId)) {
            block.parents.push(motherId);
          }
        }
      });
    }
  }

  // NUEVO: Calcular profundidades y determinar raíces
  const calculateDepths = () => {
    const visited = new Set<string>();
    const depths = new Map<string, number>();
    
    // Función recursiva para calcular profundidad
    const calculateDepth = (blockKey: string): number => {
      if (depths.has(blockKey)) {
        return depths.get(blockKey)!;
      }
      
      if (visited.has(blockKey)) {
        // Ciclo detectado, asignar profundidad 0
        return 0;
      }
      
      visited.add(blockKey);
      const block = blocks.get(blockKey);
      if (!block) return 0;
      
      let maxParentDepth = -1;
      block.parents.forEach(parentId => {
        const parentBlocks = personToBlocks.get(parentId) || [];
        parentBlocks.forEach(parentBlockKey => {
          const parentDepth = calculateDepth(parentBlockKey);
          maxParentDepth = Math.max(maxParentDepth, parentDepth);
    });
  });

      const depth = maxParentDepth + 1;
      depths.set(blockKey, depth);
      block.depth = depth;
      return depth;
    };
    
    // Calcular profundidad para todos los bloques
    blocks.forEach((block, blockKey) => {
      calculateDepth(blockKey);
    });
    
    return depths;
  };
  
  const depths = calculateDepths();
  
  // NUEVO: Determinar raíces - bloques con profundidad 0
  const roots: FamilyBlock[] = [];
  blocks.forEach(block => {
    block.isRoot = block.depth === 0;
    if (block.isRoot) {
      roots.push(block);
    }
  });

  // 3. Layout recursivo bidireccional
  const blockResult = new Map<string, { left: number; width: number; centerX: number; depth: number }>();
  let maxX = 0; let maxY = 0;

  function calculateBlockDimensions(block: FamilyBlock): { width: number; centerX: number } {
    if (blockResult.has(block.key)) {
      return { width: blockResult.get(block.key)!.width, centerX: blockResult.get(block.key)!.centerX };
    }

    const childrenOrdered = childSorter(block.children);

    // 1. Calcular ancho de los hijos recursivamente
    let childrenWidth = 0;

    for (const childId of childrenOrdered) {
      const childBlocks = personToBlocks.get(childId) || [];
      if (childBlocks.length > 0) {
        const childBlockData = blocks.get(childBlocks[0])!;
        const { width } = calculateBlockDimensions(childBlockData);
        childrenWidth += width + GAP_X;
      } else {
        // Hijo sin bloque (caso edge)
        childrenWidth += NODE_W + GAP_X;
      }
    }
    if (childrenWidth > 0) childrenWidth -= GAP_X; // quitar exceso del último gap

    // 2. Ancho propio (pareja a la izquierda del nodo principal)
    const ownWidth = block.partner2 ? NODE_W * 2 + COUPLE_GAP : NODE_W;
    const totalWidth = Math.max(ownWidth, childrenWidth);

    // 3. Posición X central (temporal, será ajustada después)
    let left = 0;
    if (block.parents.length === 0) {
      left = maxX; // raíz se coloca al final disponible
    } else {
      left = 0; // hijos serán ajustados bajo sus padres
    }
    const blockCenterX = left + totalWidth / 2;

    // 4. Guardar resultados de dimensiones
    blockResult.set(block.key, { left, width: totalWidth, centerX: blockCenterX, depth: block.depth });
    maxX = Math.max(maxX, left + totalWidth);

    return { width: totalWidth, centerX: blockCenterX };
  }

  // 4. Calcular dimensiones de todos los bloques
  blocks.forEach(block => {
    calculateBlockDimensions(block);
  });

  // 5. Procesar raíces y centrar
  if (roots.length > 0) {
    // Calcular ancho total de raíces
    const totalRootsWidth = roots.reduce((sum, root) => {
      const result = blockResult.get(root.key)!;
      return sum + result.width;
    }, 0) + (roots.length - 1) * GAP_X;

    // Centrar raíces
    let rootCursor = (contentWidth.value - totalRootsWidth) / 2;
    for (const root of roots) {
      const result = blockResult.get(root.key)!;
      result.left = rootCursor;
      result.centerX = rootCursor + result.width / 2;
      blockResult.set(root.key, result);
      
      // Posicionar nodos de la raíz
      const rowY = 0;
      maxY = Math.max(maxY, rowY + NODE_H);
      
      if (root.partner2) {
        // Usar posicionamiento basado en sexo para raíces
        const { partner1Pos, partner2Pos } = getPartnerPositions(root.partner1, root.partner2, result.centerX, rowY);
        positions.value.set(root.partner1, partner1Pos);
        positions.value.set(root.partner2, partner2Pos);
        
        // Crear línea de conexión entre pareja
        const partnerEdge = {
          x1: centerX(partner1Pos),
          y1: centerY(partner1Pos),
          x2: centerX(partner2Pos),
          y2: centerY(partner2Pos)
        };
        partnerEdges.value.push(partnerEdge);
      } else {
        // Raíz individual sin pareja
        const partner1X = result.centerX - NODE_W / 2;
        const partner1Pos = { x: partner1X, y: rowY };
        positions.value.set(root.partner1, partner1Pos);
      }
      
      rootCursor += result.width + GAP_X;
    }
  }

  // 6. Posicionar todos los bloques por profundidad
  const processedBlocks = new Set<string>();
  roots.forEach(root => processedBlocks.add(root.key));

  // Agrupar bloques por profundidad
  const blocksByDepth = new Map<number, FamilyBlock[]>();
  blocks.forEach(block => {
    if (!processedBlocks.has(block.key)) {
      if (!blocksByDepth.has(block.depth)) {
        blocksByDepth.set(block.depth, []);
      }
      blocksByDepth.get(block.depth)!.push(block);
    }
  });

  // Función auxiliar para obtener la posición del padre
  function getParentPosition(block: FamilyBlock): number {
    for (const parentId of block.parents) {
      const parentBlocks = personToBlocks.get(parentId) || [];
      for (const parentBlockKey of parentBlocks) {
        if (processedBlocks.has(parentBlockKey)) {
          const parentRes = blockResult.get(parentBlockKey);
          if (parentRes) {
            return parentRes.centerX;
          }
        }
      }
    }
    return 0;
  }

  // Procesar por niveles de profundidad
  const sortedDepths = Array.from(blocksByDepth.keys()).sort((a, b) => a - b);
  
  for (const depth of sortedDepths) {
    const blocksAtDepth = blocksByDepth.get(depth)!;
    
    // Agrupar bloques por sus padres para posicionarlos correctamente
    const blocksByParent = new Map<string, FamilyBlock[]>();
    
    for (const block of blocksAtDepth) {
      const parentKey = block.parents.length > 0 ? block.parents[0] : 'orphan';
      if (!blocksByParent.has(parentKey)) {
        blocksByParent.set(parentKey, []);
      }
      blocksByParent.get(parentKey)!.push(block);
    }
    
    // Procesar cada grupo de bloques hijo del mismo padre
    for (const [parentKey, childBlocks] of blocksByParent) {
      if (parentKey === 'orphan') {
        // Bloques huérfanos - posicionar secuencialmente
        let currentX = 0;
        for (const block of childBlocks) {
          const result = blockResult.get(block.key)!;
          result.left = currentX;
          result.centerX = currentX + result.width / 2;
          blockResult.set(block.key, result);
          currentX += result.width + GAP_X;
        }
      } else {
        // Bloques con padre - centrar bajo el padre
        const parentBlocks = personToBlocks.get(parentKey) || [];
        let parentResult: { centerX: number } | null = null;
        
          for (const parentBlockKey of parentBlocks) {
            if (processedBlocks.has(parentBlockKey)) {
            parentResult = blockResult.get(parentBlockKey);
          if (parentResult) break;
          }
        }
        
        if (parentResult) {
          // Calcular ancho total de los hijos
          const totalChildrenWidth = childBlocks.reduce((sum, block) => {
            return sum + blockResult.get(block.key)!.width;
          }, 0) + (childBlocks.length - 1) * GAP_X;
          
          // Posicionar hijos centrados bajo el padre
          let childX = parentResult.centerX - totalChildrenWidth / 2;
          
          for (const block of childBlocks) {
            const result = blockResult.get(block.key)!;
            result.left = childX;
            result.centerX = childX + result.width / 2;
          blockResult.set(block.key, result);
            childX += result.width + GAP_X;
          }
        } else {
          // Padre no encontrado - posicionar secuencialmente
          let currentX = 0;
          for (const block of childBlocks) {
            const result = blockResult.get(block.key)!;
            result.left = currentX;
            result.centerX = currentX + result.width / 2;
            blockResult.set(block.key, result);
            currentX += result.width + GAP_X;
          }
        }
      }
      
      // Posicionar nodos de todos los bloques en este grupo
      for (const block of childBlocks) {
        const result = blockResult.get(block.key)!;
            const rowY = block.depth * (NODE_H + GAP_Y);
        maxY = Math.max(maxY, rowY + NODE_H);
            
            if (block.partner2) {
          // Usar posicionamiento basado en sexo
              const { partner1Pos, partner2Pos } = getPartnerPositions(block.partner1, block.partner2, result.centerX, rowY);
              positions.value.set(block.partner1, partner1Pos);
              positions.value.set(block.partner2, partner2Pos);
          
          // Crear línea de conexión entre pareja
          const partnerEdge = {
            x1: centerX(partner1Pos),
            y1: centerY(partner1Pos),
            x2: centerX(partner2Pos),
            y2: centerY(partner2Pos)
          };
          partnerEdges.value.push(partnerEdge);
            } else {
              // Bloque individual sin pareja
              const partner1X = result.centerX - NODE_W / 2;
              const partner1Pos = { x: partner1X, y: rowY };
              positions.value.set(block.partner1, partner1Pos);
      }
      
      processedBlocks.add(block.key);
      }
    }
  }

  // 7. Crear conexiones padre-hijo
  // Función para crear conexiones padre-hijo
  function createParentChildConnections() {
    // Procesar cada bloque para crear conexiones con sus hijos
    blocks.forEach(block => {
      if (block.children.length === 0) return; // No hay hijos
      
      const result = blockResult.get(block.key);
      if (!result) return;
      
      // Obtener posiciones de los padres
      let parent1Pos: { x: number, y: number } | null = null;
      let parent2Pos: { x: number, y: number } | null = null;
      
      parent1Pos = positions.value.get(block.partner1);
      if (block.partner2) {
        parent2Pos = positions.value.get(block.partner2);
      }
      
      if (!parent1Pos) return; // Padre principal no encontrado
      
      // Calcular punto medio de los padres
      let parentMidX: number;
      let parentBottomY: number;
      
      if (parent2Pos) {
        // Pareja: usar punto medio
        parentMidX = (centerX(parent1Pos) + centerX(parent2Pos)) / 2;
        parentBottomY = Math.max(bottomY(parent1Pos), bottomY(parent2Pos));
        
        // Solo crear línea vertical central desde el punto medio (sin líneas individuales)
        const spineY = parentBottomY + 20; // 20px debajo de los padres
        
        // Línea vertical central desde el punto medio
        spineEdges.value.push({
          x1: parentMidX,
          y1: spineY,
          x2: parentMidX,
          y2: spineY + 20
        });
        
      } else {
        // Padre individual
        parentMidX = centerX(parent1Pos);
        parentBottomY = bottomY(parent1Pos);
        
        // Línea vertical desde el padre
        spineEdges.value.push({
          x1: parentMidX,
          y1: parentBottomY,
          x2: parentMidX,
          y2: parentBottomY + 40
        });
      }
      
      // Crear conexiones a cada hijo
      const childrenY = parentBottomY + 60; // 60px debajo de los padres
      
      block.children.forEach(childId => {
        const childPos = positions.value.get(childId);
        if (!childPos) return;
        
        // Línea horizontal desde el punto medio hacia el hijo
        branchEdges.value.push({
          x1: parentMidX,
          y1: childrenY,
          x2: centerX(childPos), // Terminar exactamente en el centro del hijo
          y2: childrenY
        });
        
        // Línea vertical desde la horizontal hasta el centro del hijo
        branchEdges.value.push({
          x1: centerX(childPos), // Comenzar exactamente donde termina la horizontal
          y1: childrenY,
          x2: centerX(childPos),
          y2: centerY(childPos) // Llegar hasta el centro vertical del nodo
        });
      });
    });
  }
  
  createParentChildConnections();

  // 8. Resolver colisiones entre nodos
  resolveCollisions(positions.value);
  
  // 8. Validar y corregir todas las coordenadas
  validateCoordinates(positions.value);
  
  // 9. Ajustar dimensiones del canvas
  contentWidth.value = Math.max(1200, maxX + 200);
  contentHeight.value = Math.max(800, maxY + 200);
  
  // Debug: mostrar información del layout
  console.log('Layout generado:', {
    totalBlocks: blocks.size,
    roots: roots.length,
    maxDepth: Math.max(...Array.from(blocks.values()).map(b => b.depth))
  });
  
  // Debug: mostrar información de bloques
  console.log('=== INFORMACIÓN DE BLOQUES ===');
  blocks.forEach((block, blockKey) => {
    const result = blockResult.get(blockKey);
    console.log(`Bloque ${blockKey}:`, {
      partners: [block.partner1, block.partner2],
      children: block.children,
      parents: block.parents,
      depth: block.depth,
      isRoot: block.isRoot,
      result: result
    });
  });
  
  // Debug adicional: verificar posiciones de todos los nodos
  console.log('=== POSICIONES DE NODOS FINALES ===');
  positions.value.forEach((pos, nodeId) => {
    const node = nodes.value.find(n => n.id === nodeId);
    console.log(`Nodo ${nodeId} (${node?.displayName || 'Sin nombre'}):`, {
      x: pos.x,
      y: pos.y,
      centerX: pos.x + NODE_W / 2,
      centerY: pos.y + NODE_H / 2,
      right: pos.x + NODE_W,
      bottom: pos.y + NODE_H
    });
  });
}


// Función para validar y corregir coordenadas de nodos
function validateCoordinates(nodePositions: Map<string, { x: number, y: number }>): void {
  console.log('=== VALIDANDO COORDENADAS ===');
  
  nodePositions.forEach((pos, nodeId) => {
    let corrected = false;
    const originalPos = { ...pos };
    
    // Corregir coordenadas negativas
    if (pos.x < 0) {
      console.warn(`Coordenada X negativa para nodo ${nodeId}:`, pos.x, '-> 0');
      pos.x = 0;
      corrected = true;
    }
    
    if (pos.y < 0) {
      console.warn(`Coordenada Y negativa para nodo ${nodeId}:`, pos.y, '-> 0');
      pos.y = 0;
      corrected = true;
    }
    
    // Validar que sean números válidos
    if (isNaN(pos.x) || isNaN(pos.y)) {
      console.error(`Coordenadas NaN para nodo ${nodeId}:`, pos);
      pos.x = 0;
      pos.y = 0;
      corrected = true;
    }
    
    if (corrected) {
      console.log(`Nodo ${nodeId} corregido:`, originalPos, '->', pos);
    }
  });
}


// Función para calcular distancia entre puntos
function calculateLineDistance(fromPoint: { x: number, y: number }, toPoint: { x: number, y: number }): number {
  // Validar puntos primero
  if (!fromPoint || !toPoint) {
    console.error('Puntos inválidos para cálculo de distancia');
    return 0;
  }
  
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  return Math.sqrt(dx * dx + dy * dy);
}


const openQuickModal = ref(false);
const quickContext = ref<any|null>(null);

// Variables para eliminación
const deleteConfirmModal = ref(false);
const nodeToDelete = ref<any|null>(null);
function openQuick(anchor: any, type: 'child'|'parent'|'partner' = 'child') {
  quickContext.value = { anchor, type, treeId };
  openQuickModal.value = true;
}
function openQuickRoot() {
  quickContext.value = { anchor: { id: null, displayName: '—' }, type: 'root', treeId };
  openQuickModal.value = true;
}
async function onCreated() { await fetchNodes(); }

// Funciones para eliminación
function confirmDelete(node: any) {
  nodeToDelete.value = node;
  deleteConfirmModal.value = true;
}

async function deletePerson() {
  if (!nodeToDelete.value || isDemo.value) return;
  
  try {
    console.log('Eliminando persona:', nodeToDelete.value.id, 'del árbol:', treeId);
    
    // Eliminar la persona del backend
    const response = await api.delete(`/trees/${treeId}/persons/${nodeToDelete.value.id}`);
    console.log('Respuesta del servidor:', response);
    
    // Actualizar la lista local
    nodes.value = nodes.value.filter(n => n.id !== nodeToDelete.value.id);
    
    // Limpiar selección si la persona eliminada estaba seleccionada
    if (selected.value && selected.value.id === nodeToDelete.value.id) {
      selected.value = null;
    }
    
    // Actualizar el layout
    computeHidden();
    computeLayout();
    fitToContent();
    
    // Cerrar modal
    deleteConfirmModal.value = false;
    nodeToDelete.value = null;
    
    console.log('Persona eliminada exitosamente');
  } catch (error) {
    console.error('Error eliminando persona:', error);
    console.error('Detalles del error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: `/trees/${treeId}/persons/${nodeToDelete.value.id}`
    });
    
    let errorMessage = 'Error al eliminar la persona.';
    if (error.response?.status === 404) {
      errorMessage = 'La persona no fue encontrada.';
    } else if (error.response?.status === 403) {
      errorMessage = 'No tienes permisos para eliminar esta persona.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    alert(errorMessage);
  }
}

onMounted(() => {
  fetchNodes();
  // Asegurar que el canvas tenga el foco para recibir eventos de zoom
  setTimeout(() => {
    if (canvas.value) {
      canvas.value.focus();
      // Forzar centrado después de que todo esté cargado
      setTimeout(() => {
        fitToContent();
      }, 200);
    }
  }, 100);
  
  // Agregar listener para redimensionamiento de ventana
  const handleResize = () => {
    setTimeout(() => {
      fitToContent();
    }, 100);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Cleanup al desmontar
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });
});
</script>

<style scoped>
.canvas { 
  height: 70vh; 
  border: 1px solid var(--color-border); 
  border-radius: 10px; 
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative; 
  overflow: hidden; 
  outline: none;
  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}
.content { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
.edges { position: absolute; left: 0; top: 0; pointer-events: none; }
.edge { 
  fill: none; 
  stroke-width: 3; 
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke: white;
}
.edge.partner { 
  stroke-width: 4; 
  stroke: white;
  opacity: 1;
}
.edge.spine { 
  stroke-width: 3; 
  stroke: white;
  opacity: 1;
}
.edge.branch { 
  stroke-width: 2; 
  stroke: white;
  opacity: 1;
}
/* Nodos con diseño de modales */
.node { 
  position: absolute; 
  background: #ffffff; 
  border: 1px solid var(--color-border); 
  border-radius: 0.25rem; 
  padding: 1.5rem; 
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.1); 
  cursor: pointer; 
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
  transition: all 0.15s ease-in-out;
}

.node:hover {
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.node.male { border-color: #93c5fd; }
.node.male .avatar-text { 
  background: #dbeafe; 
  border-color: #93c5fd; 
  color: #1e40af;
}

.node.female { border-color: #f9a8d4; }
.node.female .avatar-text { 
  background: #fce7f3; 
  border-color: #f9a8d4; 
  color: #be185d;
}

.node.unknown { border-color: var(--color-border); }
.node.unknown .avatar-text { 
  background: #f3f4f6; 
  border-color: var(--color-border); 
  color: #6b7280;
}

.node .avatar-text { 
  min-width: 48px; 
  height: 48px; 
  border-radius: 24px; 
  background: #e5e7eb; 
  margin: 0 auto 0.5rem auto;
  border: 2px solid var(--color-border);
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: #374151;
  padding: 0 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.node .name { 
  font-weight: 600; 
  font-size: 1rem;
  line-height: 1.4;
  color: var(--color-primary);
  text-align: center;
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  margin: 0;
  padding: 0;
}

.node .years { 
  color: #6b7280; 
  font-size: 0.875rem; 
  text-align: center;
  margin: 0;
  padding: 0;
  line-height: 1.4;
}

.node .actions { 
  position: absolute; 
  right: 0.75rem; 
  bottom: 0.75rem; 
  display: flex;
  gap: 0.25rem;
}

.node .actions .delete-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  width: 24px;
  height: 24px;
  font-size: 0.875rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.node .actions .delete-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}



/* Dark mode para canvas y nodos */
@media (prefers-color-scheme: dark) {
  .canvas {
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
    border-color: #374151;
  }
  
  .node {
    background: #1f2937;
    border-color: #374151;
  }
  
  .node .name {
    color: #f9fafb;
  }
  
  .node .years {
    color: #d1d5db;
  }
  
  .node .avatar-text {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  .node.male .avatar-text { 
    background: #1e3a8a; 
    border-color: #3b82f6; 
    color: #dbeafe;
  }

  .node.female .avatar-text { 
    background: #be185d; 
    border-color: #f9a8d4; 
    color: #fce7f3;
  }

  .node.unknown .avatar-text { 
    background: #4b5563; 
    border-color: #6b7280; 
    color: #d1d5db;
  }
  
  
  .edge { 
    stroke: white;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
  .edge.partner { 
    stroke: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
  }
  .edge.spine { 
    stroke: white;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  }
  .edge.branch { 
    stroke: white;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
  }
  
  
  .side {
    background: linear-gradient(135deg, #0f0f23 0%, #1a0d3a 100%);
  }
  
  .suggestions {
    background: #1f2937;
    border-color: #374151;
  }
  
  .suggestions li:hover {
    background: #374151;
  }
  
  .modal {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .modal h3 {
    color: #f9fafb;
  }
  
  .modal p {
    color: #d1d5db;
  }
  
  .modal .warning {
    color: #fca5a5;
  }
  
  .btn-secondary {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .btn-secondary:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
}

.side { 
  position: fixed; 
  right: 24px; 
  top: 140px; 
  width: 390px; 
  background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%);
  border: none;
  border-radius: 16px; 
  padding: 0; 
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1); 
  z-index: 1000; 
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-height: calc(100vh - 180px);
  overflow: hidden;
  backdrop-filter: blur(10px);
}
/* Estilos para elementos internos del aside */
.side-header {
  display: flex;
  align-items: center;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  gap: 16px;
}

.person-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.person-info {
  flex: 1;
}

.person-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.person-years {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 500;
}

.side-close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}


.side-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.side-content::-webkit-scrollbar {
  width: 6px;
}

.side-content::-webkit-scrollbar-track {
  background: transparent;
}

.side-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.side-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.info-section {
  margin-bottom: 32px;
}

.info-section h3 {
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(5px);
}

.info-label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 0.9rem;
}

.info-value {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.relationships {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.relationship-group h4 {
  color: white;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.relationship-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  backdrop-filter: blur(5px);
}

.relationship-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.relationship-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.relationship-name {
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
}

.suggestions { 
  position: absolute; 
  background: #ffffff; 
  border: 1px solid #d1d5db; 
  border-radius: 0.5rem; 
  padding: 0.5rem; 
  list-style: none; 
  margin: 0; 
  max-height: 200px; 
  overflow: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.suggestions li { 
  padding: 0.5rem 0.75rem; 
  cursor: pointer; 
  border-radius: 0.375rem;
  transition: background-color 0.15s ease-in-out;
  color: #374151;
}

.suggestions li:hover { 
  background: #f3f4f6; 
  color: #111827;
}

/* Modal de confirmación */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal p {
  margin: 0 0 0.75rem 0;
  color: #374151;
  line-height: 1.5;
}

.modal .warning {
  color: #dc2626;
  font-weight: 500;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: 1px solid #ef4444;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}
</style>
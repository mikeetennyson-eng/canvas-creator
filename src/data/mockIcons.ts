import type { IconData } from '@/types/editor';

// Mock data — replace with fetch('/api/icons') when backend is ready
export const MOCK_ICONS: IconData[] = [
  // Cells & Biology
  { id: 'cell-1', name: 'Red Blood Cell', category: 'Cells', tags: ['blood', 'erythrocyte', 'hematology'], svg_url: '', attribution_required: true, author: 'BioIcons', license: 'CC BY 4.0', source_url: 'https://bioicons.com' },
  { id: 'cell-2', name: 'White Blood Cell', category: 'Cells', tags: ['immune', 'leukocyte'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  { id: 'cell-3', name: 'Neuron', category: 'Cells', tags: ['brain', 'nerve', 'synapse'], svg_url: '', attribution_required: true, author: 'BioIcons', license: 'CC BY 4.0', source_url: 'https://bioicons.com' },
  { id: 'cell-4', name: 'Epithelial Cell', category: 'Cells', tags: ['tissue', 'skin'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  // Molecular
  { id: 'mol-1', name: 'DNA Helix', category: 'Molecular', tags: ['dna', 'genetics', 'double helix'], svg_url: '', attribution_required: true, author: 'Servier Medical Art', license: 'CC BY 3.0', source_url: 'https://smart.servier.com' },
  { id: 'mol-2', name: 'Protein', category: 'Molecular', tags: ['amino acid', 'enzyme'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  { id: 'mol-3', name: 'RNA Strand', category: 'Molecular', tags: ['rna', 'mrna', 'transcription'], svg_url: '', attribution_required: true, author: 'BioIcons', license: 'CC BY 4.0', source_url: 'https://bioicons.com' },
  { id: 'mol-4', name: 'Antibody', category: 'Molecular', tags: ['immunoglobulin', 'immune'], svg_url: '', attribution_required: true, author: 'Servier Medical Art', license: 'CC BY 3.0', source_url: 'https://smart.servier.com' },
  // Organs
  { id: 'org-1', name: 'Heart', category: 'Organs', tags: ['cardiac', 'cardiovascular'], svg_url: '', attribution_required: true, author: 'Servier Medical Art', license: 'CC BY 3.0', source_url: 'https://smart.servier.com' },
  { id: 'org-2', name: 'Brain', category: 'Organs', tags: ['cerebrum', 'neuroscience'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  { id: 'org-3', name: 'Lungs', category: 'Organs', tags: ['respiratory', 'pulmonary'], svg_url: '', attribution_required: true, author: 'BioIcons', license: 'CC BY 4.0', source_url: 'https://bioicons.com' },
  { id: 'org-4', name: 'Kidney', category: 'Organs', tags: ['renal', 'nephron'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  // Lab Equipment
  { id: 'lab-1', name: 'Microscope', category: 'Lab Equipment', tags: ['microscopy', 'optics'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  { id: 'lab-2', name: 'Test Tube', category: 'Lab Equipment', tags: ['chemistry', 'sample'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  { id: 'lab-3', name: 'Petri Dish', category: 'Lab Equipment', tags: ['culture', 'bacteria'], svg_url: '', attribution_required: true, author: 'BioIcons', license: 'CC BY 4.0', source_url: 'https://bioicons.com' },
  { id: 'lab-4', name: 'Centrifuge', category: 'Lab Equipment', tags: ['separation', 'spin'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  // Pathways
  { id: 'path-1', name: 'Receptor', category: 'Pathways', tags: ['signal', 'membrane'], svg_url: '', attribution_required: true, author: 'Servier Medical Art', license: 'CC BY 3.0', source_url: 'https://smart.servier.com' },
  { id: 'path-2', name: 'Ion Channel', category: 'Pathways', tags: ['membrane', 'transport'], svg_url: '', attribution_required: true, author: 'BioIcons', license: 'CC BY 4.0', source_url: 'https://bioicons.com' },
  { id: 'path-3', name: 'Vesicle', category: 'Pathways', tags: ['transport', 'endocytosis'], svg_url: '', attribution_required: false, author: 'SciDraw', license: 'CC0', source_url: 'https://scidraw.io' },
  { id: 'path-4', name: 'Mitochondria', category: 'Pathways', tags: ['energy', 'atp', 'organelle'], svg_url: '', attribution_required: true, author: 'Servier Medical Art', license: 'CC BY 3.0', source_url: 'https://smart.servier.com' },
];

export async function fetchIcons(): Promise<IconData[]> {
  // When backend is ready, replace with:
  // const res = await fetch('/api/icons');
  // return res.json();
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_ICONS), 300));
}

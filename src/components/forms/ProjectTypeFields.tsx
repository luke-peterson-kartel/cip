import type { ProjectType, ProjectCreate } from '@/types'
import { Input } from '@/components/ui'
import { RichTextEditor } from './RichTextEditor'

interface ProjectTypeFieldsProps {
  projectType: ProjectType
  formData: Partial<ProjectCreate>
  onChange: (field: keyof ProjectCreate, value: any) => void
}

export function ProjectTypeFields({ projectType, formData, onChange }: ProjectTypeFieldsProps) {
  // Internal Build fields
  if (projectType === 'INTERNAL_BUILD') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Internal Build Details</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700">Problem</label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            value={formData.problem || ''}
            onChange={(e) => onChange('problem', e.target.value)}
            placeholder="What problem are we solving?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Solution</label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            value={formData.solution || ''}
            onChange={(e) => onChange('solution', e.target.value)}
            placeholder="Proposed solution approach"
          />
        </div>

        <Input
          label="Goal"
          value={formData.goal || ''}
          onChange={(e) => onChange('goal', e.target.value)}
          placeholder="What's the measurable goal?"
        />

        <Input
          label="Why"
          value={formData.why || ''}
          onChange={(e) => onChange('why', e.target.value)}
          placeholder="Why is this important?"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">Technical Workflow Scope</label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={4}
            value={formData.technicalWorkflowScope || ''}
            onChange={(e) => onChange('technicalWorkflowScope', e.target.value)}
            placeholder="Describe the technical implementation plan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Data Requirements</label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
            value={formData.dataRequirements || ''}
            onChange={(e) => onChange('dataRequirements', e.target.value)}
            placeholder="What data is needed for this project?"
          />
        </div>
      </div>
    )
  }

  // Creative Brief fields (now includes Assets Generation)
  if (projectType === 'CREATIVE_BRIEF') {
    const assetSpecs = formData.assetSpecs || []

    const handleAddAssetSpec = () => {
      const newSpec = {
        title: '',
        numberOfAssets: 0,
        timeline: '',
        duration: undefined,
      }
      onChange('assetSpecs', [...assetSpecs, newSpec])
    }

    const handleRemoveAssetSpec = (index: number) => {
      onChange('assetSpecs', assetSpecs.filter((_, i) => i !== index))
    }

    const handleAssetSpecChange = (index: number, field: string, value: any) => {
      const updated = assetSpecs.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      )
      onChange('assetSpecs', updated)
    }

    return (
      <div className="space-y-6">
        {/* Step 1: Creative Brief Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
            Step 1: Creative Brief Details
          </h3>

          <RichTextEditor
            value={formData.briefContent || ''}
            onChange={(html) => onChange('briefContent', html)}
          />
        </div>

        {/* Step 2: Assets Generation Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Step 2: Assets Generation Specifications
            </h3>
            <button
              type="button"
              onClick={handleAddAssetSpec}
              className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Asset Spec
            </button>
          </div>

          {assetSpecs.length === 0 && (
            <p className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
              No asset specifications yet. Click "Add Asset Spec" to create one.
            </p>
          )}

          {assetSpecs.map((spec, index) => (
            <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Asset Spec #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveAssetSpec(index)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>

              <Input
                label="Title/Description"
                value={spec.title || ''}
                onChange={(e) => handleAssetSpecChange(index, 'title', e.target.value)}
                placeholder="e.g., Instagram Stories Campaign"
              />

              <Input
                label="Number of Assets"
                type="number"
                value={spec.numberOfAssets || ''}
                onChange={(e) => handleAssetSpecChange(index, 'numberOfAssets', parseInt(e.target.value) || 0)}
                placeholder="48"
              />

              <Input
                label="Timeline"
                value={spec.timeline || ''}
                onChange={(e) => handleAssetSpecChange(index, 'timeline', e.target.value)}
                placeholder="e.g., 3 weeks"
              />

              <Input
                label="Duration (seconds, for video)"
                type="number"
                value={spec.duration || ''}
                onChange={(e) => handleAssetSpecChange(index, 'duration', parseInt(e.target.value) || undefined)}
                placeholder="15"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

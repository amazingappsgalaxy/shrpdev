'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Folder, 
  Image as ImageIcon, 
  Calendar,
  MoreHorizontal,
  Archive,
  Play,
  Pause
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description?: string
  imageIds: string[]
  status: 'active' | 'completed' | 'archived'
  createdAt: number
  updatedAt: number
}

interface ProjectManagerProps {
  projects: Project[]
  userImages: any[]
  onCreateProject: (name: string, description: string) => void
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void
}

export default function ProjectManager({ 
  projects, 
  userImages, 
  onCreateProject, 
  onUpdateProject 
}: ProjectManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectDescription.trim())
      setNewProjectName('')
      setNewProjectDescription('')
      setShowCreateForm(false)
    }
  }

  const getProjectImages = (imageIds: string[]) => {
    return userImages.filter(img => imageIds.includes(img.id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-purple-600" />
            <span>Projects</span>
            <Badge variant="secondary">{projects.length}</Badge>
          </CardTitle>
          <Button 
            size="sm" 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h4 className="font-medium text-slate-900 mb-3">Create New Project</h4>
            <div className="space-y-3">
              <Input
                placeholder="Project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <Textarea
                placeholder="Project description (optional)"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                rows={2}
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleCreateProject}>
                  Create Project
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No projects yet</p>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const projectImages = getProjectImages(project.imageIds)
              return (
                <div 
                  key={project.id} 
                  className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-slate-900">{project.name}</h4>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-slate-600 mb-2">{project.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-1">
                          <ImageIcon className="w-4 h-4" />
                          <span>{project.imageIds.length} images</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {formatDate(project.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {project.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateProject(project.id, { status: 'completed' })}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {project.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateProject(project.id, { status: 'active' })}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onUpdateProject(project.id, { status: 'archived' })}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {projectImages.length > 0 && (
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                      {projectImages.slice(0, 5).map((image) => (
                        <div key={image.id} className="flex-shrink-0">
                          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                            <img
                              src={image.enhancedUrl || image.originalUrl}
                              alt={image.filename}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://via.placeholder.com/64x64/e2e8f0/64748b?text=${encodeURIComponent(image.filename.slice(0, 2))}`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      {projectImages.length > 5 && (
                        <div className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-slate-600">+{projectImages.length - 5}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
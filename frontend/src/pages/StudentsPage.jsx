import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import studentService from '../services/studentService';

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para o Modal/Formulário de Adição
  const [openModal, setOpenModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    contact_info: '',
    skill_level: '',
    notes: '',
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Estados para o Modal de Edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [editError, setEditError] = useState('');

  // Estados para o Modal de Confirmação de Eliminação
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentService.getStudents();
      setStudents(data);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // --- Funções Modal de Adição ---
  const handleOpenModal = () => {
    setNewStudent({ name: '', contact_info: '', skill_level: '', notes: '' });
    setModalError('');
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleNewStudentChange = (e) => {
    setNewStudent({
      ...newStudent,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddNewStudent = async () => {
    // Validação do nome (obrigatório no backend)
    if (!newStudent.name || newStudent.name.trim() === '') {
        setModalError('O nome é obrigatório.');
        return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await studentService.createStudent(newStudent);
      setModalLoading(false);
      handleCloseModal();
      loadStudents();
    } catch (err) {
      setModalError(err.response?.data?.message || err.toString());
      setModalLoading(false);
    }
  };

  // --- Funções Modal de Edição ---
  const handleOpenEditModal = (student) => {
    setCurrentStudent({ ...student });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setCurrentStudent(null);
  };

  const handleEditStudentChange = (e) => {
    setCurrentStudent({
      ...currentStudent,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateStudent = async () => {
    if (!currentStudent || !currentStudent.name || currentStudent.name.trim() === '') {
      setEditError('O nome não pode ficar vazio.');
      return;
    }
    setModalLoading(true);
    setEditError('');
    try {
      await studentService.updateStudent(currentStudent.id, currentStudent);
      setModalLoading(false);
      handleCloseEditModal();
      loadStudents();
    } catch (err) {
      setEditError(err.response?.data?.message || err.toString());
      setModalLoading(false);
    }
  };

  // --- Funções Modal de Eliminação ---
  const handleOpenDeleteModal = (student) => {
    setStudentToDelete(student);
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setModalLoading(true);
    setDeleteError('');
    try {
      await studentService.deleteStudent(studentToDelete.id);
      setModalLoading(false);
      handleCloseDeleteModal();
      loadStudents();
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.toString());
      setModalLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Meus Alunos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            Adicionar Aluno
          </Button>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}

        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de alunos">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Nível</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Ainda não tens alunos registados.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">{student.name}</TableCell>
                      <TableCell>{student.contact_info || 'N/A'}</TableCell>
                      <TableCell>{student.skill_level || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenEditModal(student)} aria-label="editar">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleOpenDeleteModal(student)} aria-label="apagar">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Modal Adicionar Aluno */}
      <Dialog open={openModal} onClose={handleCloseModal} disableRestoreFocus>
        <DialogTitle>Adicionar Novo Aluno</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Preenche os dados do novo aluno.
          </DialogContentText>
          {modalError && <Alert severity="error" sx={{ mb: 2 }}>{modalError}</Alert>}
          <TextField autoFocus margin="dense" name="name" label="Nome Completo *" type="text" fullWidth variant="standard" value={newStudent.name} onChange={handleNewStudentChange} disabled={modalLoading} />
          <TextField margin="dense" name="contact_info" label="Contacto (Email/Telefone)" type="text" fullWidth variant="standard" value={newStudent.contact_info} onChange={handleNewStudentChange} disabled={modalLoading} />
          <TextField margin="dense" name="skill_level" label="Nível" type="text" fullWidth variant="standard" value={newStudent.skill_level} onChange={handleNewStudentChange} disabled={modalLoading} />
          <TextField margin="dense" name="notes" label="Notas / Observações" type="text" fullWidth multiline rows={3} variant="standard" value={newStudent.notes} onChange={handleNewStudentChange} disabled={modalLoading} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} disabled={modalLoading}>Cancelar</Button>
          <Button onClick={handleAddNewStudent} variant="contained" disabled={modalLoading}>
            {modalLoading ? <CircularProgress size={24} /> : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar Aluno */}
      {currentStudent && (
        <Dialog open={editModalOpen} onClose={handleCloseEditModal} disableRestoreFocus>
          <DialogTitle>Editar Aluno</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Atualize os dados do aluno.
            </DialogContentText>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
            <TextField autoFocus margin="dense" name="name" label="Nome Completo *" type="text" fullWidth variant="standard" value={currentStudent.name} onChange={handleEditStudentChange} disabled={modalLoading} />
            <TextField margin="dense" name="contact_info" label="Contacto" type="text" fullWidth variant="standard" value={currentStudent.contact_info || ''} onChange={handleEditStudentChange} disabled={modalLoading} />
            <TextField margin="dense" name="skill_level" label="Nível" type="text" fullWidth variant="standard" value={currentStudent.skill_level || ''} onChange={handleEditStudentChange} disabled={modalLoading} />
            <TextField margin="dense" name="notes" label="Notas" type="text" fullWidth multiline rows={3} variant="standard" value={currentStudent.notes || ''} onChange={handleEditStudentChange} disabled={modalLoading} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseEditModal} disabled={modalLoading}>Cancelar</Button>
            <Button onClick={handleUpdateStudent} variant="contained" disabled={modalLoading}>
              {modalLoading ? <CircularProgress size={24} /> : 'Guardar Alterações'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Modal Confirmar Eliminação */}
      {studentToDelete && (
        <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal}>
          <DialogTitle>Confirmar Eliminação</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem a certeza que deseja apagar o aluno **{studentToDelete.name}**? Esta ação não pode ser revertida.
            </DialogContentText>
            {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDeleteModal} disabled={modalLoading}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={modalLoading}>
              {modalLoading ? <CircularProgress size={24} /> : 'Apagar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}

export default StudentsPage;
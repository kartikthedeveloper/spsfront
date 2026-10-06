import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MessageCircle,
  X,
} from 'lucide-react';

import AppShell from '../components/AppShell';
import {
  PageHeader,
  EmptyState,
  Modal,
} from '../components/ui';

import api from '../api/axios';


// =====================================================
// PAGE
// =====================================================

export default function ContactMessages() {
  // ===================================================
  // STATES
  // ===================================================

  const [contacts, setContacts] = useState([]);

  const [open, setOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contactNumber: '',
    message: '',
    date: new Date().toISOString().split('T')[0],
  });


  // ===================================================
  // API ENDPOINT
  // ===================================================

  const API_URL = '/contact-messages/contact';


  // ===================================================
  // LOAD CONTACTS
  // ===================================================

  const load = async () => {
    try {
      setLoading(true);

      const { data } = await api.get(API_URL);

      setContacts(data.data || []);
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          'Could not load contact messages'
      );
    } finally {
      setLoading(false);
    }
  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    load();
  }, []);


  // ===================================================
  // RESET FORM
  // ===================================================

  const resetForm = () => {
    setForm({
      name: '',
      contactNumber: '',
      message: '',
      date: new Date().toISOString().split('T')[0],
    });

    setEditingId(null);
  };


  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    resetForm();
    setOpen(true);
  };


  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (contact) => {
    setEditingId(contact._id);

    setForm({
      name: contact.name || '',

      contactNumber:
        contact.contactNumber || '',

      message:
        contact.message || '',

      date: contact.date
        ? new Date(contact.date)
            .toISOString()
            .split('T')[0]
        : new Date().toISOString().split('T')[0],
    });

    setOpen(true);
  };


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (saving) return;

    setOpen(false);
    resetForm();
  };


  // ===================================================
  // FORM CHANGE
  // ===================================================

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  // ===================================================
  // CREATE / UPDATE
  // ===================================================

  const submit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Please enter name');
      return;
    }

    if (!form.contactNumber.trim()) {
      toast.error('Please enter contact number');
      return;
    }

    if (!form.message.trim()) {
      toast.error('Please enter message');
      return;
    }


    // Remove everything except digits
    const cleanNumber =
      form.contactNumber.replace(/\D/g, '');

    if (
      cleanNumber.length !== 10 &&
      cleanNumber.length !== 12
    ) {
      toast.error(
        'Please enter a valid contact number'
      );

      return;
    }


    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),

        contactNumber:
          form.contactNumber.trim(),

        message:
          form.message.trim(),

        date:
          form.date ||
          new Date().toISOString(),
      };


      // =================================================
      // UPDATE
      // =================================================

      if (editingId) {
        await api.put(
          `${API_URL}/${editingId}`,
          payload
        );

        toast.success(
          'Contact updated successfully'
        );
      }

      // =================================================
      // CREATE
      // =================================================

      else {
        await api.post(
          API_URL,
          payload
        );

        toast.success(
          'Contact saved successfully'
        );
      }


      closeModal();

      load();

    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          'Could not save contact'
      );
    } finally {
      setSaving(false);
    }
  };


  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this contact?'
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `${API_URL}/${id}`
      );

      toast.success(
        'Contact deleted successfully'
      );

      load();

    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          'Could not delete contact'
      );
    }
  };


  // ===================================================
  // SEND WHATSAPP
  // ===================================================

  const sendWhatsApp = (contact) => {
    let phone =
      String(
        contact.contactNumber || ''
      ).replace(/\D/g, '');


    if (!phone) {
      toast.error(
        'Invalid contact number'
      );

      return;
    }


    // -----------------------------------------------
    // Indian 10 digit number
    // -----------------------------------------------

    if (phone.length === 10) {
      phone = `91${phone}`;
    }


    // -----------------------------------------------
    // 0XXXXXXXXXX
    // -----------------------------------------------

    if (
      phone.length === 11 &&
      phone.startsWith('0')
    ) {
      phone =
        `91${phone.substring(1)}`;
    }


    // -----------------------------------------------
    // PERSONALIZED MESSAGE
    // -----------------------------------------------

    const personalizedMessage =
      String(
        contact.message || ''
      ).replace(
        /{name}/gi,
        contact.name || ''
      );


    const encodedMessage =
      encodeURIComponent(
        personalizedMessage
      );


    const whatsappUrl =
      `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;


    window.open(
      whatsappUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };


  // ===================================================
  // SEARCH
  // ===================================================

  const filteredContacts = useMemo(() => {
    const text =
      search.trim().toLowerCase();

    if (!text) return contacts;

    return contacts.filter((contact) => {
      return (
        String(contact.name || '')
          .toLowerCase()
          .includes(text) ||

        String(
          contact.contactNumber || ''
        )
          .toLowerCase()
          .includes(text) ||

        String(contact.message || '')
          .toLowerCase()
          .includes(text)
      );
    });
  }, [contacts, search]);


  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };


  // ===================================================
  // JSX
  // ===================================================

  return (
    <AppShell title="Messages">

      {/* =============================================
          PAGE HEADER
      ============================================== */}

      <PageHeader
        title="Manish Tech Messages"
        description="Manage contacts and send personalized WhatsApp messages."
        action={
          <button
            className="btn-accent"
            onClick={openAddModal}
          >
            <Plus size={16} />
            Add Contact
          </button>
        }
      />


      {/* =============================================
          SEARCH + SUMMARY
      ============================================== */}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div className="text-sm text-ink-600">
          Total Contacts:{' '}
          <span className="font-semibold text-ink-950">
            {contacts.length}
          </span>
        </div>


        <div className="relative w-full md:w-80">

          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
          />

          <input
            type="text"
            className="input pl-9"
            placeholder="Search name or contact..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>


      {/* =============================================
          EMPTY STATE
      ============================================== */}

      {!loading &&
      contacts.length === 0 ? (

        <EmptyState
          title="No contact messages yet"
          description="Add a contact to start sending personalized WhatsApp messages."
        />

      ) : (


        /* ===========================================
           TABLE
        ============================================ */

        <div className="card overflow-x-auto">

          {loading ? (

            <div className="py-12 text-center text-sm text-ink-600">
              Loading contact messages...
            </div>

          ) : filteredContacts.length === 0 ? (

            <div className="py-12 text-center text-sm text-ink-600">
              No contacts found for your search.
            </div>

          ) : (

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-ink-100 text-left text-xs uppercase text-ink-600">

                  <th className="px-4 py-3">
                    #
                  </th>

                  <th className="px-4 py-3">
                    Name
                  </th>

                  <th className="px-4 py-3">
                    Contact
                  </th>

                  <th className="px-4 py-3">
                    Date
                  </th>

                  <th className="px-4 py-3">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredContacts.map(
                  (contact, index) => (

                    <tr
                      key={contact._id}
                      className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50"
                    >

                      {/* NUMBER */}

                      <td className="px-4 py-3 text-ink-600">
                        {index + 1}
                      </td>


                      {/* NAME */}

                      <td className="px-4 py-3">

                        <div className="font-medium text-ink-950">
                          {contact.name}
                        </div>

                      </td>


                      {/* CONTACT */}

                      <td className="px-4 py-3 text-ink-700 whitespace-nowrap">

                        {contact.contactNumber}

                      </td>




                      {/* DATE */}

                      <td className="px-4 py-3 whitespace-nowrap text-ink-700">

                        {formatDate(
                          contact.date
                        )}

                      </td>


                      {/* ACTIONS */}

                      <td className="px-4 py-3">

                        <div className="flex flex-wrap gap-2">

                          {/* WHATSAPP */}

                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#20bd5a]"
                            onClick={() =>
                              sendWhatsApp(
                                contact
                              )
                            }
                            title="Open WhatsApp with message"
                          >
                            <MessageCircle
                              size={14}
                            />

                            Send
                          </button>


                          {/* EDIT */}

                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-ink-200"
                            onClick={() =>
                              openEditModal(
                                contact
                              )
                            }
                          >
                            <Pencil
                              size={14}
                            />

                            Edit
                          </button>


                          {/* DELETE */}

                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            onClick={() =>
                              handleDelete(
                                contact._id
                              )
                            }
                          >
                            <Trash2
                              size={14}
                            />

                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      )}


      {/* =============================================
          ADD / EDIT MODAL
      ============================================== */}

      <Modal
        open={open}
        onClose={closeModal}
        title={
          editingId
            ? 'Edit Contact'
            : 'Add Contact'
        }
      >

        <form
          onSubmit={submit}
          className="space-y-4"
        >

          {/* NAME */}

          <div>

            <label className="label">
              Name
            </label>

            <input
              type="text"
              className="input"
              placeholder="Enter name"
              required
              value={form.name}
              onChange={(e) =>
                updateForm(
                  'name',
                  e.target.value
                )
              }
            />

          </div>


          {/* CONTACT NUMBER */}

          <div>

            <label className="label">
              Contact Number
            </label>

            <input
              type="tel"
              className="input"
              placeholder="9876543210"
              required
              value={
                form.contactNumber
              }
              onChange={(e) =>
                updateForm(
                  'contactNumber',
                  e.target.value
                )
              }
            />

            <p className="mt-1 text-xs text-ink-500">
              Enter Indian 10-digit mobile
              number.
            </p>

          </div>


          {/* DATE */}

          <div>

            <label className="label">
              Date
            </label>

            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) =>
                updateForm(
                  'date',
                  e.target.value
                )
              }
            />

          </div>


          {/* MESSAGE */}

          <div>

            <label className="label">
              WhatsApp Message
            </label>

            <textarea
              className="input min-h-[140px] resize-y"
              placeholder={`Hello {name},

Your class is scheduled tomorrow at 10 AM.

Regards,
Manish Tech`}
              required
              value={form.message}
              onChange={(e) =>
                updateForm(
                  'message',
                  e.target.value
                )
              }
            />

            <p className="mt-1 text-xs text-ink-500">
              Use{' '}
              <span className="font-semibold">
                {'{name}'}
              </span>{' '}
              to automatically insert the
              student's name.
            </p>

          </div>


          {/* BUTTONS */}

          <div className="flex gap-3 pt-2">

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving
                ? editingId
                  ? 'Updating…'
                  : 'Saving…'
                : editingId
                ? 'Update Contact'
                : 'Save Contact'}
            </button>


            <button
              type="button"
              disabled={saving}
              className="btn-secondary"
              onClick={closeModal}
            >
              <X size={16} />
              Cancel
            </button>

          </div>

        </form>

      </Modal>

    </AppShell>
  );
}

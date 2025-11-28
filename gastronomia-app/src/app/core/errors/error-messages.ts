import { ErrorMessageConfig } from './error.model';

export const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {

  // ───────────────────────────────
  // SEATING
  // ───────────────────────────────
  SEATING_ALREADY_EXISTS: {
    title: 'No se pudo crear la mesa',
    message: 'Ya existe una mesa con ese número en el salón.',
    severity: 'error'
  },
  SEATING_NOT_FOUND: {
    title: 'Mesa no encontrada',
    message: 'No se pudo localizar la mesa seleccionada.',
    severity: 'error'
  },
  SEATING_MODIFICATION_NOT_ALLOWED: {
    title: 'Acción no permitida sobre la mesa',
    message: 'La mesa no se encuentra en un estado que permita esta operación.',
    severity: 'error'
  },

  // ───────────────────────────────
  // ORDERS
  // ───────────────────────────────
  ORDER_NOT_FOUND: {
    title: 'Orden no encontrada',
    message: 'No se pudo encontrar la orden seleccionada.',
    severity: 'error'
  },
  ORDER_MODIFICATION_NOT_ALLOWED: {
    title: 'No se pudo modificar la orden',
    message: 'La orden no permite modificaciones en su estado actual.',
    severity: 'error'
  },
  ORDER_ITEM_NOT_FOUND: {
    title: 'Item de orden no encontrado',
    message: 'No se pudo encontrar el item de la orden.',
    severity: 'error'
  },

  // ───────────────────────────────
  // PRODUCTS / STOCK
  // ───────────────────────────────
  NOT_ENOUGH_STOCK: {
    title: 'Stock insuficiente',
    message: 'No hay stock suficiente para completar la operación.',
    severity: 'error'
  },
  PRODUCT_NOT_FOUND: {
    title: 'Producto no encontrado',
    message: 'No se pudo encontrar el producto seleccionado.',
    severity: 'error'
  },
  PRODUCT_GROUP_NOT_FOUND: {
    title: 'Grupo de productos no encontrado',
    message: 'No se pudo encontrar el grupo de productos seleccionado.',
    severity: 'error'
  },
  PRODUCT_GROUP_CANNOT_BE_DELETED: {
    title: 'No se pudo eliminar el grupo',
    message: 'El grupo de productos no puede ser eliminado por su uso actual.',
    severity: 'error'
  },
  PRODUCT_OPTION_NOT_FOUND: {
    title: 'Opción de producto no encontrada',
    message: 'No se pudo encontrar la opción de producto seleccionada.',
    severity: 'error'
  },
  CATEGORY_NOT_FOUND: {
    title: 'Categoría no encontrada',
    message: 'No se pudo encontrar la categoría seleccionada.',
    severity: 'error'
  },
  CATEGORY_CANNOT_BE_DELETED: {
    title: 'No se puede eliminar la categoría',
    message: 'La categoría no puede ser eliminada por su uso actual.',
    severity: 'error'
  },
  CATEGORY_NAME_ALREADY_EXISTS: {
    title: 'Nombre de categoría duplicado',
    message: 'Ya existe una categoría registrada con ese nombre.',
    severity: 'warning'
  },
  PRODUCT_GROUP_NAME_ALREADY_EXISTS: {
    title: 'Nombre de grupo de productos duplicado',
    message: 'Ya existe un grupo de productos registrado con ese nombre.',
    severity: 'warning'
  },
  PRODUCT_NAME_ALREADY_EXISTS: {
    title: 'Nombre de producto duplicado',
    message: 'Ya existe un producto registrado con ese nombre.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // AUDITS
  // ───────────────────────────────
  AUDIT_NOT_FOUND: {
    title: 'Auditoría no encontrada',
    message: 'No se pudo encontrar la auditoría solicitada.',
    severity: 'error'
  },
  AUDIT_IN_PROGRESS: {
    title: 'Auditoría en curso',
    message: 'Ya existe una auditoría activa. Finalizala antes de crear otra.',
    severity: 'warning'
  },
  AUDIT_MODIFICATION_NOT_ALLOWED: {
    title: 'Modificación no permitida',
    message: 'La auditoría no permite esta acción en su estado actual.',
    severity: 'error'
  },

  // ───────────────────────────────
  // BUSINESS
  // ───────────────────────────────
  BUSINESS_NOT_FOUND: {
    title: 'Negocio no encontrado',
    message: 'No se pudo encontrar el negocio solicitado.',
    severity: 'error'
  },
  BUSINESS_NAME_ALREADY_EXISTS: {
    title: 'Nombre de negocio duplicado',
    message: 'Ya existe un negocio registrado con ese nombre.',
    severity: 'warning'
  },
  BUSINESS_CUIT_ALREADY_EXISTS: {
    title: 'CUIT de negocio duplicado',
    message: 'Ya existe un negocio registrado con este CUIT.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // CUSTOMERS
  // ───────────────────────────────
  CUSTOMER_ALREADY_ACTIVE: {
    title: 'Cliente ya existe',
    message: 'El cliente ya está registrado y activo en el negocio.',
    severity: 'warning'
  },
  CUSTOMER_NOT_FOUND: {
    title: 'Cliente no encontrado',
    message: 'No se pudo encontrar el cliente solicitado.',
    severity: 'error'
  },
  CUSTOMER_DNI_ALREADY_EXISTS: {
    title: 'DNI de cliente duplicado',
    message: 'Ya existe un cliente registrado con este DNI.',
    severity: 'warning'
  },
  CUSTOMER_EMAIL_ALREADY_EXISTS: {
    title: 'Email de cliente duplicado',
    message: 'Ya existe un cliente registrado con este email.',
    severity: 'warning'
  },
  CUSTOMER_PHONE_NUMBER_ALREADY_EXISTS: {
    title: 'Teléfono de cliente duplicado',
    message: 'Ya existe un cliente registrado con este teléfono.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // EXPENSES
  // ───────────────────────────────
  EXPENSE_NOT_FOUND: {
    title: 'Gasto no encontrado',
    message: 'No se pudo encontrar el gasto seleccionado.',
    severity: 'error'
  },

  // ───────────────────────────────
  // SUPPLIERS
  // ───────────────────────────────
  SUPPLIER_NOT_FOUND: {
    title: 'Proveedor no encontrado',
    message: 'No se pudo encontrar el proveedor solicitado.',
    severity: 'error'
  },
  SUPPLIER_ALREADY_ACTIVE: {
    title: 'Proveedor ya activo',
    message: 'Ya existe un proveedor con este CUIT en el negocio.',
    severity: 'warning'
  },
  SUPPLIER_CUIT_ALREADY_EXISTS: {
    title: 'CUIT de proveedor duplicado',
    message: 'Ya existe un proveedor registrado con este CUIT.',
    severity: 'warning'
  },
  SUPPLIER_EMAIL_ALREADY_EXISTS: {
    title: 'Email de proveedor duplicado',
    message: 'Ya existe un proveedor registrado con este email.',
    severity: 'warning'
  },
  SUPPLIER_LEGAL_NAME_ALREADY_EXISTS: {
    title: 'Razón social duplicada',
    message: 'Ya existe un proveedor registrado con esta razón social.',
    severity: 'warning'
  },
  SUPPLIER_PHONE_NUMBER_ALREADY_EXISTS: {
    title: 'Teléfono de proveedor duplicado',
    message: 'Ya existe un proveedor registrado con este teléfono.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // EMPLOYEES
  // ───────────────────────────────
  EMPLOYEE_ALREADY_ACTIVE: {
    title: 'Empleado ya existe',
    message: 'El empleado ya está activo y registrado en el negocio.',
    severity: 'warning'
  },
  EMPLOYEE_CANNOT_BE_DELETED: {
    title: 'No se puede eliminar al empleado',
    message: 'Este empleado no puede eliminarse por su rol o uso actual.',
    severity: 'error'
  },
  EMPLOYEE_DELETED: {
    title: 'Empleado eliminado',
    message: 'Este empleado fue eliminado y no puede usarse.',
    severity: 'error'
  },
  EMPLOYEE_NOT_FOUND: {
    title: 'Empleado no encontrado',
    message: 'No se pudo encontrar el empleado solicitado.',
    severity: 'error'
  },

  // ───────────────────────────────
  // OWNER
  // ───────────────────────────────
  OWNER_ALREADY_EXISTS: {
    title: 'Dueño ya registrado',
    message: 'El negocio ya tiene un dueño asignado.',
    severity: 'warning'
  },
  OWNER_CANNOT_BE_DELETED: {
    title: 'No se puede eliminar al dueño',
    message: 'El dueño del negocio no puede ser eliminado.',
    severity: 'error'
  },

  // ───────────────────────────────
  // DNI
  // ───────────────────────────────
  DNI_ALREADY_EXISTS: {
    title: 'DNI duplicado',
    message: 'Ya existe un empleado registrado con este DNI.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // AUTH / USERS
  // ───────────────────────────────
  INVALID_PASSWORD: {
    title: 'Credenciales inválidas',
    message: 'La contraseña ingresada no es correcta.',
    severity: 'error'
  },
  NO_LOGGED_USER: {
    title: 'Sesión no encontrada',
    message: 'No se encontró un usuario autenticado para esta operación.',
    severity: 'error'
  },
  EMPLOYEE_PERMISSION_DENIED: {
    title: 'Permisos insuficientes',
    message: 'No tenés permisos para realizar esta acción.',
    severity: 'error'
  },
  USERNAME_ALREADY_EXISTS: {
    title: 'Nombre de usuario duplicado',
    message: 'Ya existe un usuario registrado con este nombre de usuario.',
    severity: 'warning'
  },
  EMAIL_ALREADY_EXISTS: {
    title: 'Email duplicado',
    message: 'Ya existe un usuario registrado con este email.',
    severity: 'warning'
  },
  PHONE_NUMBER_ALREADY_EXISTS: {
    title: 'Teléfono duplicado',
    message: 'Ya existe un usuario registrado con este número de teléfono.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // VALIDATIONS
  // ───────────────────────────────
  VALIDATION_ERROR: {
    title: 'Datos inválidos',
    message: 'Revisá la información ingresada. Hay campos con errores.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // DATES
  // ───────────────────────────────
  INVALID_DATE: {
    title: 'Rango de fechas inválido',
    message: 'El rango de fechas ingresado no es válido para la operación.',
    severity: 'warning'
  },

  // ───────────────────────────────
  // DATABASE / GENERIC
  // ───────────────────────────────
  DATABASE_ERROR: {
    title: 'Error en la base de datos',
    message: 'Ocurrió un problema al acceder a la información. Intentá nuevamente.',
    severity: 'error'
  },

  DATABASE_CONSTRAINT_VIOLATION: {
    title: 'Conflicto con datos existentes',
    message: 'Se detectó un conflicto con datos ya registrados. Verificá que no estés duplicando información e intentá nuevamente.',
    severity: 'error'
  },

  INTERNAL_ERROR: {
    title: 'Error interno inesperado',
    message: 'Ocurrió un error inesperado en el sistema. Intentá nuevamente y, si persiste, contactá al administrador.',
    severity: 'error'
  }
};

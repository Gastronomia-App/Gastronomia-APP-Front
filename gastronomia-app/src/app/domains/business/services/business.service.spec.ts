import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BusinessService } from './business.service';
import { Business, PageResponse } from '../../../shared/models';
import { environment } from '../../../../enviroments/environment';

describe('BusinessService', () => {
  let service: BusinessService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BusinessService]
    });
    service = TestBed.inject(BusinessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBusinesses', () => {
    it('should fetch all businesses', () => {
      const mockBusinesses: Business[] = [
        {
          id: 1,
          name: 'Business 1',
          cuit: '20-12345678-9',
          address: {
            street: 'Street 1',
            city: 'City 1',
            province: 'Province 1',
            zipCode: '1234'
          }
        }
      ];

      service.getBusinesses().subscribe(businesses => {
        expect(businesses).toEqual(mockBusinesses);
        expect(businesses.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/businesses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBusinesses);
    });
  });

  describe('getBusinessesPage', () => {
    it('should fetch paginated businesses', () => {
      const mockPageResponse: PageResponse<Business> = {
        content: [
          {
            id: 1,
            name: 'Business 1',
            cuit: '20-12345678-9',
            address: {
              street: 'Street 1',
              city: 'City 1',
              province: 'Province 1',
              zipCode: '1234'
            }
          }
        ],
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: { sorted: false, unsorted: true, empty: true },
          offset: 0,
          paged: true,
          unpaged: false
        },
        totalPages: 1,
        totalElements: 1,
        size: 20,
        number: 0,
        sort: { sorted: false, unsorted: true, empty: true },
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false
      };

      service.getBusinessesPage(0, 20).subscribe(response => {
        expect(response).toEqual(mockPageResponse);
        expect(response.content.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/businesses?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should use default pagination values', () => {
      const mockPageResponse: PageResponse<Business> = {
        content: [],
        pageable: {
          pageNumber: 0,
          pageSize: 20,
          sort: { sorted: false, unsorted: true, empty: true },
          offset: 0,
          paged: true,
          unpaged: false
        },
        totalPages: 0,
        totalElements: 0,
        size: 20,
        number: 0,
        sort: { sorted: false, unsorted: true, empty: true },
        numberOfElements: 0,
        first: true,
        last: true,
        empty: true
      };

      service.getBusinessesPage().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/businesses?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });
  });

  describe('getBusinessById', () => {
    it('should fetch a business by id', () => {
      const mockBusiness: Business = {
        id: 1,
        name: 'Business 1',
        cuit: '20-12345678-9',
        address: {
          street: 'Street 1',
          city: 'City 1',
          province: 'Province 1',
          zipCode: '1234'
        }
      };

      service.getBusinessById(1).subscribe(business => {
        expect(business).toEqual(mockBusiness);
      });

      const req = httpMock.expectOne(`${apiUrl}/businesses/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBusiness);
    });
  });

  describe('createBusiness', () => {
    it('should create a new business', () => {
      const mockBusinessRequest = {
        name: 'New Business',
        cuit: '20-12345678-9',
        address: {
          street: 'Street 1',
          city: 'City 1',
          province: 'Province 1',
          zipCode: '1234'
        },
        owner: {
          name: 'John',
          lastName: 'Doe',
          dni: '12345678',
          email: 'john@example.com',
          phoneNumber: '1234567890',
          username: 'johndoe',
          password: 'password123',
          role: 'OWNER'
        }
      };

      const mockBusinessResponse: Business = {
        id: 1,
        name: 'New Business',
        cuit: '20-12345678-9',
        address: {
          street: 'Street 1',
          city: 'City 1',
          province: 'Province 1',
          zipCode: '1234'
        }
      };

      service.createBusiness(mockBusinessRequest).subscribe(business => {
        expect(business).toEqual(mockBusinessResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/businesses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockBusinessRequest);
      req.flush(mockBusinessResponse);
    });
  });

  describe('updateBusiness', () => {
    it('should update an existing business', () => {
      const mockUpdateDTO: Partial<Business> = {
        name: 'Updated Business',
        cuit: '20-12345678-9',
        address: {
          street: 'Updated Street',
          city: 'Updated City',
          province: 'Updated Province',
          zipCode: '5678'
        }
      };

      const mockBusinessResponse: Business = {
        id: 1,
        name: 'Updated Business',
        cuit: '20-12345678-9',
        address: {
          street: 'Updated Street',
          city: 'Updated City',
          province: 'Updated Province',
          zipCode: '5678'
        }
      };

      service.updateBusiness(1, mockUpdateDTO).subscribe(business => {
        expect(business).toEqual(mockBusinessResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/businesses/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateDTO);
      req.flush(mockBusinessResponse);
    });
  });

  describe('deleteBusiness', () => {
    it('should delete a business', () => {
      service.deleteBusiness(1).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/businesses/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
